"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import AuthProvider from "../components/AuthProvider";
import { UIProvider } from "../contexts/UIContext";
import { setupGlobalAPIs } from "../utils/globalSetup";
import { getErrorMessage } from "../types";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error: unknown) => {
              // Don't retry on certain errors
              const errorMsg = getErrorMessage(error);
              if (errorMsg.includes("401") || errorMsg.includes("403")) {
                return false; // Authentication/authorization errors
              }
              if (errorMsg.includes("404")) {
                return false; // Not found errors
              }
              // Retry network errors up to 3 times with exponential backoff
              return failureCount < 3;
            },
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
            throwOnError: false, // Let components handle errors gracefully
          },
          mutations: {
            retry: (failureCount, error: unknown) => {
              // Don't retry mutations on client errors (4xx)
              const errorMsg = getErrorMessage(error);
              if (errorMsg.includes("4")) {
                return false;
              }
              // Only retry server errors (5xx) once
              return failureCount < 1;
            },
            throwOnError: false,
          },
        },
      }),
  );

  // Run global setup once on client side
  useEffect(() => {
    setupGlobalAPIs();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <UIProvider>{children}</UIProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
