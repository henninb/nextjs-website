"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import User from "../model/User";
import useLogout from "../hooks/useLogoutProcess";
import { initCsrfToken } from "../utils/csrf";

const SESSION_DURATION = 60 * 60 * 1000; // 1 hour
const SESSION_WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before expiry
const SESSION_CHECK_INTERVAL = 30 * 1000; // check every 30 seconds
const SESSION_STORAGE_KEY = "sessionExpiresAt";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (user: User) => Promise<void>;
  logout: () => void;
  showSessionWarning: boolean;
  sessionMinutesRemaining: number;
  dismissSessionWarning: () => void;
  extendSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const useProvideAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const [sessionMinutesRemaining, setSessionMinutesRemaining] = useState(0);
  const router = useRouter();
  const pathname = usePathname();
  const { logoutNow } = useLogout();

  const requiresAuth = (path: string): boolean => {
    const authRequiredPaths = [
      "/finance",
      "/login",
      "/register",
      "/registration",
      "/logout",
      "/me",
      "/payment",
    ];

    return authRequiredPaths.some((authPath) => path.startsWith(authPath));
  };

  const clearSession = useCallback(() => {
    setSessionExpiresAt(null);
    setShowSessionWarning(false);
    setSessionMinutesRemaining(0);
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch {
      // localStorage may not be available
    }
  }, []);

  const performLogout = useCallback(async () => {
    clearSession();
    await logoutNow();
    setUser(null);
    setIsAuthenticated(false);
    router.push("/login");
  }, [clearSession, logoutNow, router]);

  const setSessionExpiry = useCallback((expiresAt: number) => {
    setSessionExpiresAt(expiresAt);
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, String(expiresAt));
    } catch {
      // localStorage may not be available
    }
  }, []);

  useEffect(() => {
    async function fetchUser() {
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
          await initCsrfToken();

          // Restore session expiry from localStorage if available
          try {
            const stored = localStorage.getItem(SESSION_STORAGE_KEY);
            if (stored) {
              const storedExpiry = Number(stored);
              if (storedExpiry > Date.now()) {
                setSessionExpiresAt(storedExpiry);
              } else {
                // Stored time has passed but session is still valid on backend
                // Set a new expiry from now
                setSessionExpiry(Date.now() + SESSION_DURATION);
              }
            }
          } catch {
            // localStorage may not be available
          }
        } else {
          setIsAuthenticated(false);
          setUser(null);
          clearSession();
        }
      } catch (error) {
        setIsAuthenticated(false);
        setUser(null);
        clearSession();
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Session expiry check interval
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiresAt) {
      return;
    }

    const checkSession = async () => {
      const now = Date.now();
      const timeRemaining = sessionExpiresAt - now;

      if (timeRemaining <= 0) {
        // Session expired - verify with backend
        try {
          const res = await fetch("/api/me", { credentials: "include" });
          if (!res.ok) {
            await performLogout();
            return;
          }
          // Backend still accepts the session, push expiry forward
          setSessionExpiry(Date.now() + SESSION_DURATION);
          setShowSessionWarning(false);
        } catch {
          await performLogout();
        }
        return;
      }

      if (timeRemaining <= SESSION_WARNING_THRESHOLD) {
        setShowSessionWarning(true);
        setSessionMinutesRemaining(
          Math.max(1, Math.ceil(timeRemaining / 60000)),
        );
      } else {
        setShowSessionWarning(false);
      }
    };

    checkSession();
    const intervalId = setInterval(checkSession, SESSION_CHECK_INTERVAL);
    return () => clearInterval(intervalId);
  }, [isAuthenticated, sessionExpiresAt, performLogout, setSessionExpiry]);

  const login = async (user: User) => {
    setUser(user);
    setIsAuthenticated(true);
    setSessionExpiry(Date.now() + SESSION_DURATION);
    await initCsrfToken();
  };

  const logout = async () => {
    await performLogout();
  };

  const dismissSessionWarning = useCallback(() => {
    setShowSessionWarning(false);
  }, []);

  const extendSession = useCallback(async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      if (res.ok) {
        setSessionExpiry(Date.now() + SESSION_DURATION);
        setShowSessionWarning(false);
      } else {
        await performLogout();
      }
    } catch {
      await performLogout();
    }
  }, [performLogout, setSessionExpiry]);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    showSessionWarning,
    sessionMinutesRemaining,
    dismissSessionWarning,
    extendSession,
  };
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
