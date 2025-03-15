import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  FC,
} from "react";
import { useRouter } from "next/router";

// Define the shape of our context with an authentication flag.
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Create the AuthContext.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const router = useRouter();

  // Optionally, on mount you could check authentication status from a secure endpoint.
  useEffect(() => {
    // Example: fetch('/api/auth/me', { credentials: 'include' })
    //   .then(res => res.ok && setIsAuthenticated(true))
    //   .catch(() => setIsAuthenticated(false));
    // For now, we assume the user is not authenticated by default.
  }, []);

  // The login function simply marks the user as authenticated.
  // The server has already set the JWT in an HTTP-only cookie.
  const login = () => {
    setIsAuthenticated(true);
  };

  // The logout function clears the local auth state and redirects to the login page.
  // Optionally, you could also call a backend endpoint to clear the cookie.
  const logout = () => {
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
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
