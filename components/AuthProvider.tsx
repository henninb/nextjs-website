"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import User from "../model/User";
import useLogout from "../hooks/useLogoutProcess";
import { initCsrfToken } from "../utils/csrf";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean; // New loading flag
  login: (user: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useProvideAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as loading
  const router = useRouter();
  const pathname = usePathname();
  const { logoutNow } = useLogout();

  // Helper function to determine if current page requires authentication
  const requiresAuth = (path: string): boolean => {
    const authRequiredPaths = [
      '/finance',
      '/login',
      '/register',
      '/registration',
      '/logout',
      '/me',
      '/payment'
    ];

    return authRequiredPaths.some(authPath => path.startsWith(authPath));
  };

  useEffect(() => {
    async function fetchUser() {
      // Skip authentication check for pages that don't require it
      if (!requiresAuth(pathname)) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsAuthenticated(true);
          // Initialize CSRF token for authenticated user
          await initCsrfToken();
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname]); // Re-run when pathname changes

  const login = async (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
    // Initialize CSRF token for newly logged in user
    await initCsrfToken();
  };

  const logout = async () => {
    await logoutNow();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  };

  return { isAuthenticated, user, loading, login, logout };
};

export default function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useProvideAuth();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
