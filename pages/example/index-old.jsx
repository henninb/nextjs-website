import React from 'react';
import jwt from 'jsonwebtoken';

const TestPage = ({ user }) => {
  return (
    <div>
      <h1>Protected Test Page</h1>
    </div>
  );
};

export async function getServerSideProps(context) {
  const { req, res } = context;
  const token = req.cookies.token;

  if (!token) {
    console.log('no cookie set');
    //res.writeHead(302, { Location: '/login' });
    res.end();
    return { props: {} };
  }

  try {
    // const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const decoded = jwt.verify(token, 'your_jwt_key');
    return { props: { user: decoded } };
  } catch (error) {
    console.log(error);
    //res.writeHead(302, { Location: '/login' });
    //res.end();
    return { props: {} };
  }
}

export default TestPage;
