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

// Extract authentication logic into a function

const useProvideAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Simulating auth check
    const storedAuth = localStorage.getItem("auth") === "true";
    setIsAuthenticated(storedAuth);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem("auth", "true"); // Persist session
  };

  const logout = async () => {
    const { logout } = useLogout();
    await logout()
    setIsAuthenticated(false);
    localStorage.removeItem("auth");
    router.push("/login");
  };

  return { isAuthenticated, login, logout };
};

// **Step 2: Create a Context Provider Component**

export default function AuthProvider({ children }: { children: ReactNode }) {
  //export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const auth = useProvideAuth(); // Use the extracted function logic
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

// **Step 3: Create a Hook for Using AuthContext**
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

//export default AuthProvider;
