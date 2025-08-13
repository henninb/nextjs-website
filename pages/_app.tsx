import "../styles/index.css";
import Layout from "../components/Layout";
import AuthProvider from "../components/AuthProvider";
import ErrorBoundary from "../components/ErrorBoundary";
import { UIProvider } from "../contexts/UIContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { AppProps } from "next/app";
import React from "react";
import { setupGlobalAPIs } from "../utils/globalSetup";

// Run global setup once, outside of React component lifecycle
if (typeof window !== "undefined") {
  setupGlobalAPIs();
}

export default function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 10 * 60 * 1000, // 10 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              // Don't retry on certain errors
              if (
                error?.message?.includes("401") ||
                error?.message?.includes("403")
              ) {
                return false; // Authentication/authorization errors
              }
              if (error?.message?.includes("404")) {
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
            retry: (failureCount, error: any) => {
              // Don't retry mutations on client errors (4xx)
              if (error?.message?.includes("4")) {
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

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <UIProvider>
            <Layout>
              <ErrorBoundary>
                <Component {...pageProps} />
              </ErrorBoundary>
            </Layout>
          </UIProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
