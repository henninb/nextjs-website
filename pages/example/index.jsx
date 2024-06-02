// import React from 'react';
import { useAuth } from '../../components/AuthContext';
import cookie from 'js-cookie';

const ProtectedPage = () => {
  const { token, login, logout } = useAuth();

  const handleLogin = () => {
    // Replace with actual login logic
    const token = cookie.get('token');
    login(token);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div>
      <h1>Protected Page</h1>
      <p>Token: {token}</p>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleLogout}>Logout</button>
    </div>
  );
};

export default ProtectedPage;
