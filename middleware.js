import { NextResponse } from "next/server";
import {perimeterx} from 'perimeterx-nextjs';

// export const runtime = 'edge';
const pxConfigFile = require('./config');

// initialize config outside the handler
const pxConfig = new Config(pxConfigFile);

// const pxConfig = {
//   px_app_id: "<APP_ID>",
//   px_cookie_secret: "<COOKIE_SECRET>",
//   px_auth_token: "<AUTH_TOKEN>",
//   px_module_mode: "active_blocking",
// }

export async function middleware(request) {
  // Check for authentication token in the request header
  // const token = request.headers.get("Authorization");
  // if (!token) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }

  // Call next() to continue request flow if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ["/nba", "/nhl", "/mlb"], // Apply middleware only to these routes
};

async function validateToken(token) {
  try {
    // Replace 'YOUR_SECRET_KEY' with your actual secret key
    const secret = new TextEncoder().encode("your_jwt_key");

    // Use jose.jwtVerify to perform validation
    const { payload } = await jose.jwtVerify(token, secret);

    // Check for required claims (optional)
    if (!payload.email) {
      throw new Error("Missing required claims in token");
    }

    // Check for expiration (optional)
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) {
      throw new Error("Token expired");
    }

    // Token is valid, return user data from payload (optional)
    return { username: payload.username };
  } catch (error) {
    console.error("Error validating token:", error.message);
    // You can throw a custom error here or return a specific response object
    throw new Error("Invalid token");
  }
}
