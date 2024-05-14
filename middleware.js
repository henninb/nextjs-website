import { NextResponse, NextRequest } from 'next/server';
const {perimeterx} = require("perimeterx-nextjs")

export default function middleware(request) {
  // Log the request URL
  console.log('Request URL:', request.url);

  const pxConfig = {
    px_app_id: "<APP_ID>",
    px_cookie_secret: "<COOKIE_SECRET>",
    px_auth_token: "<AUTH_TOKEN>",
    px_module_mode: "active_blocking",
    px_monitored_routes: ['/monitored_route'],
  }

  // Check for a specific header
  // const token = request.headers.get('x-custom-token');
  // if (!token) {
  //   // If the token is not present, respond with a 401 status
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  // Continue to the next middleware or the request handler
  return NextResponse.next();
}
