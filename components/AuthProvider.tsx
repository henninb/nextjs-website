import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import useLogout from "../hooks/useLogoutProcess";

// Define the shape of our auth state
interface AuthContextType {
  isAuthenticated: boolean;
  login: () => void;
  logout: () => void;
}

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Extract authentication logic into a custom hook
const useProvideAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  // Call useLogout at the top level of the hook
  const { logoutNow } = useLogout();

  useEffect(() => {
    // Simulate auth check
    const storedAuth = localStorage.getItem("auth") === "true";
    setIsAuthenticated(storedAuth);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("auth", "true");
  };

  const logout = async () => {
    await logoutNow();
    setIsAuthenticated(false);
    localStorage.removeItem("auth");
    router.push("/login");
  };

  return { isAuthenticated, login, logout };
};

// Context Provider Component
export default function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// Hook for accessing the AuthContext
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
