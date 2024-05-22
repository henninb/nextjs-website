import {NextResponse} from 'next/server';
// const {perimeterx} = require("perimeterx-nextjs")
//import {perimeterx} from 'perimeterx-nextjs';

// export const runtime = 'edge';

// const pxConfig = {
//   px_app_id: "<APP_ID>",
//   px_cookie_secret: "<COOKIE_SECRET>",
//   px_auth_token: "<AUTH_TOKEN>",
//   px_module_mode: "active_blocking",
// }

export async function middleware(request) {
  // Check for authentication token in the request header
  const token = request.headers.get('Authorization');
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Call next() to continue request flow if authenticated
  return NextResponse.next();
}

export const config = {
  matcher: ['/nba', '/nhl'], // Apply middleware only to these routes
};
