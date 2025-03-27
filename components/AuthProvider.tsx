import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter } from "next/router";
import User from "../model/User";
import useLogout from "../hooks/useLogoutProcess";


// Define the shape of our auth state including the user object
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}


// ** cannot store the password in localStorage ***

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Extract authentication logic into a custom hook
const useProvideAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  // Call useLogout at the top level of the hook
  const { logoutNow } = useLogout();

  useEffect(() => {
    // Check if a user is stored in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  // Update login to accept a user object
  const login = (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
    // Store user information as a JSON string in localStorage
    localStorage.setItem("user", JSON.stringify(user));
  };

  const logout = async () => {
    await logoutNow();
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem("user");
    router.push("/login");
  };

  return { isAuthenticated, user, login, logout };
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