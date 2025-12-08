"use client";

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

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean; // New loading flag
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useProvideAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Start as loading
  const router = useRouter();
  const { logoutNow } = useLogout();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setIsAuthenticated(true);
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
  }, []); // Empty dependency array is correct

  const login = (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
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
