import {NextResponse} from 'next/server';
import jwt from 'jsonwebtoken';

export const runtime = 'edge';

export default async function Login(request) {
  const requestBody = await request.json();
  const EMAIL = 'henninb@gmail.com'; // Replace with your email
  const PASSWORD = 'monday1'; // Replace with your password
  const JWT_KEY = 'your_jwt_key'; // Replace with your JWT key

  const email = requestBody.email;
  const password = requestBody.password;
  // const { email, password } = request.body;
  // console.log('email:', request.body.email);

  if (email === EMAIL && password === PASSWORD) {
    const token = jwt.sign(
      {
        email: email,
        password: password,
        nbf: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 1 * (60 * 60), // Expires: Now + 1h
      },
      JWT_KEY,
    );

    return NextResponse.json({token: token})
  } else {
    return new Response(JSON.stringify({error: 'Failed login attempt.'}), {status: 403});
  }
}
