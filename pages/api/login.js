//const jwt = require('jsonwebtoken');
import jwt from 'jsonwebtoken';

export default async function Login(request, response) {
  const EMAIL = 'henninb@gmail.com'; // Replace with your email
  const PASSWORD = 'monday1'; // Replace with your password
  const JWT_KEY = 'your_jwt_key'; // Replace with your JWT key

  console.log('body:', request.body);
  const { email, password } = request.body;
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

    response.set('x-custom-brian', '1');
    response.status(200).json( {
      token: token,
    });
  } else {
    response.status(403).json({
      message: 'failed login attempt.',
    });
  }
}
