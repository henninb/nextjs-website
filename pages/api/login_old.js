import { NextResponse } from "next/server";
//import { cookies} from 'next/headers';
import { SignJWT } from "jose";

export const runtime = "edge";

export default async function POST(request) {
  const EMAIL = "henninb@gmail.com"; // Replace with your email
  const PASSWORD = "monday1"; // Replace with your password
  const JWT_KEY = "your_jwt_key"; // Replace with your JWT key
  let requestBody = {};
  try {
    requestBody = await request.json();
  } catch (e) {
    console.log("failed to parse json");
  }

  console.log(requestBody);
  const email = requestBody.email;
  console.log(email);
  const password = requestBody.password;
  // const { email, password } = request.body;

  if (email === EMAIL && password === PASSWORD) {
    try {
      const jwtClaims = {
        email: email,
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 60 * 60, // Expires: Now + 1h
      };

      const encoder = new TextEncoder();
      const token = await new SignJWT(jwtClaims)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .sign(encoder.encode(JWT_KEY));

      console.log(token);
      // const cookieStore = cookies()
      // const token1 = cookieStore.get(token);

      const cookieOptions = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 24 * 60 * 60, // 24 hours in seconds
        path: "/",
      };

      return new Response(JSON.stringify({ token }), {
        status: 200,
        //cookie.set('token', jwtToken, { expires: 1 });
        headers: {
          "Content-Type": "application/json",
          "Set-Cookie": `token=${token}; Path=${cookieOptions.path}; Max-Age=${cookieOptions.maxAge}`,
        },
      });

      // return NextResponse.json({ token: token });
    } catch (error) {
      console.log(error);
      return NextResponse.json({ error: "Failed to generate token" });
    }
  } else {
    return new Response(JSON.stringify({ error: "Failed login attempt." }), {
      status: 403,
    });
  }
}
