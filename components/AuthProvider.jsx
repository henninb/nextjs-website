import React, { createContext, useContext, useState, useEffect } from "react";
import cookie from 'js-cookie';
import { useRouter } from 'next/router';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a token in the cookies and set it in the state
    const token = cookie.get('token');
    if (token) {
      setToken(token);
    }
  }, []);

  const login = (jwtToken) => {
    setToken(jwtToken);
    cookie.set('token', jwtToken, { expires: 1 }); // Store token in cookie
  };

  const logout = () => {
    setToken(null);
    cookie.remove('token'); // Remove token from cookie
    router.push('/login'); // Redirect to login page
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
