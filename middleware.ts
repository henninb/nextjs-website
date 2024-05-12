import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Log the request URL
  console.log('Request URL:', request.url);

  // Check for a specific header
  // const token = request.headers.get('x-custom-token');
  // if (!token) {
  //   // If the token is not present, respond with a 401 status
  //   return new NextResponse('Unauthorized', { status: 401 });
  // }

  // Continue to the next middleware or the request handler
  return NextResponse.next();
}
