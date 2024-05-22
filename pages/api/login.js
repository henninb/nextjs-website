import {NextResponse} from 'next/server';
import { SignJWT } from 'jose';

export const runtime = 'edge';

export default async function POST(request) {
  const EMAIL = 'henninb@gmail.com'; // Replace with your email
  const PASSWORD = 'monday1'; // Replace with your password
  const JWT_KEY = 'your_jwt_key'; // Replace with your JWT key
  let requestBody = {}
  try {
    requestBody = await request.json();
  }
  catch(e) {
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
        password: password,
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // Expires: Now + 1h
      };

      const encoder = new TextEncoder();
      const token = await new SignJWT(jwtClaims)
        .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
        .sign(encoder.encode(JWT_KEY));

      console.log(token);

      return NextResponse.json({ token: token });
    } catch (error) {
      console.log(error);
      return NextResponse.json({ error: "Failed to generate token" });
    }
  } else {
    return new Response(JSON.stringify({error: 'Failed login attempt.'}), {status: 403});
  }
}
