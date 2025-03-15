import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from "react";
import cookie from "js-cookie";
import { useRouter } from "next/router";
import { jwtVerify } from "jose";

const JWT_KEY = "your_jwt_key"; // Replace with your JWT key

// Define the shape of our context
interface AuthContextType {
  token: string | null;
  login: (jwtToken: string) => Promise<boolean>;
  logout: () => void;
}

// Create the AuthContext with an undefined default value instead of an empty string.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define props for the AuthProvider component
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [redirect, setRedirect] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    // Check if there's a token in the cookies and set it in the state
    const tokenFromCookie = cookie.get("token");
    if (tokenFromCookie) {
      setToken(tokenFromCookie);
    } else {
      cookie.remove("token"); // Remove invalid token
    }
  }, []);

  useEffect(() => {
    if (redirect) {
      router.push("/login"); // Redirect if needed
    }
  }, [redirect, router]);

  const validateToken = async (token: string): Promise<boolean> => {
    try {
      const encoder = new TextEncoder();
      await jwtVerify(token, encoder.encode(JWT_KEY));
      return true;
    } catch (error) {
      console.log(`token=${token}`);
      console.log("invalid login");
      return false;
    }
  };

  const login = async (jwtToken: string): Promise<boolean> => {
    if (await validateToken(jwtToken)) {
      console.log("valid login");
      setToken(jwtToken);
      setRedirect(false);
      return true;
    } else {
      setRedirect(true);
      return false;
    }
  };

  const logout = (): void => {
    setToken(null);
    cookie.remove("token"); // Remove token from cookie
    setRedirect(true);
  };

  return (
    <AuthContext.Provider value={{ token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthProvider;
