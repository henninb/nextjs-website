import React, { createContext, useContext, useState,useEffect } from "react";
import cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { jwtVerify } from 'jose';

// Create the AuthContext
const AuthContext = createContext();

const JWT_KEY = "your_jwt_key"; // Replace with your JWT key

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a token in the cookies and set it in the state
    const token = cookie.get('token');
    if (token) {
      //console.log(`token=${token}`)
      setToken(token);
    } else {
      cookie.remove('token'); // Remove invalid token
    }
  }, []);

  const login = (jwtToken) => {
    if (validateToken(jwtToken)) {
      console.log('valid login');
    } else {
      router.push('/login');
    }
    setToken(jwtToken);
  };

  const logout = () => {
    setToken(null);
    cookie.remove('token'); // Remove token from cookie
    router.push('/login'); // Redirect to login page
  };

  const validateToken = async (token) => {
    try {
      const encoder = new TextEncoder();
      await jwtVerify(token, encoder.encode(JWT_KEY));
      return true;
    } catch (error) {
      console.error('Invalid token:', error);
      return false;
    }
  };

  // const validateToken = (token) => {
  //   try {
  //     // Replace 'your-secret-key' with your actual secret key
  //     const decoded = jwt.verify(token, 'your_jwt_key');
  //     // You can also check the expiration and other claims here if needed
  //     return true;
  //   } catch (error) {
  //     //console.error('Invalid token:', error);
  //     console.log('invalid token');
  //     return false;
  //   }
  // };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
