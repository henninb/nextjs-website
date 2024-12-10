import { NextResponse } from "next/server";
import { perimeterx } from "perimeterx-nextjs";

// export const runtime = 'edge';
export const runtime = "experimental-edge";
// const pxConfigFile = require('./config');

// initialize config outside the handler
// const pxConfig = new Config(pxConfigFile);

const pxConfig = {
  px_app_id: "PXjJ0cYtn9",
  px_cookie_secret: "secret",
  px_auth_token: "token",
  px_module_mode: "active_blocking",
  px_first_party_enabled: true,
  px_logger_severity: "debug",
  px_bypass_monitor_header: "x-px-block",
  px_js_ref: "https://henninb.github.io/human-challenge/human-challenge.js",
  px_filter_by_http_method: ["OPTIONS"],
  px_enrich_custom_parameters: async (config, httpRequest) => {
    try {
      const gidCookie = httpRequest.cookies.get("_px3")?.value;
      console.log("GID Cookie:", gidCookie);
      return {
        custom_param1: "hardcoded value",
        custom_param2: gidCookie,
      };
    } catch (e) {
      return null;
    }
  },
};

const human = perimeterx(pxConfig);

export async function middleware(request) {
  // human.enforce(request);
  // Check for authentication token in the request header
  // const token = request.headers.get("Authorization");
  // if (!token) {
  //   return NextResponse.redirect(new URL("/login", request.url));
  // }
  const { cookies } = request;

  // Extract the _ga cookie
  const gaCookie = cookies.get("_px3") || "";

  // Log or use the _ga cookie as needed
  // console.log('GA Cookie:', gaCookie);

  // Call next() to continue request flow if authenticated
  console.log("middleware called.");
  return human(request);
  // return NextResponse.next();
}

export const config = {
  matcher: ["/nba", "/nhl"], // Apply middleware only to these routes
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
