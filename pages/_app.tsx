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
            retry: 1,
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
