import "../styles/index.css";
import Layout from "../components/Layout";
import AuthProvider from "../components/AuthProvider";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { AppProps } from "next/app";
import React from "react";

export default function MyApp({ Component, pageProps }: AppProps) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    (window as any)._pxCustomAbrDomains = [
      "amazonaws.com",
      "execute-api.us-east-1.amazonaws.com",
    ];

    (function () {
      const customCookieHeader = "x-px-cookies";
      const cookiesToSync = ["_px2", "_px3", "_pxhd", "_pxvid", "pxcts"];
      const domainsToSync = [
        "amazonaws.com",
        "execute-api.us-east-1.amazonaws.com",
      ];

      if (customCookieHeader && cookiesToSync.length && domainsToSync.length) {
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function (...args) {
          originalOpen.apply(this, args);
          try {
            if (shouldSyncCookies(args[1])) {
              const cookies = getCookiesToSync();
              if (cookies) {
                this.setRequestHeader(customCookieHeader, cookies);
              }
            }
          } catch (error) {
            console.error(error);
          }
        };

        if (window.fetch) {
          const originalFetch = window.fetch;
          window.fetch = function (...args) {
            try {
              if (shouldSyncCookies(args[0] as string)) {
                const cookies = getCookiesToSync();
                if (cookies) {
                  if (!args[1]) args[1] = {};
                  if (!args[1].headers) args[1].headers = {};
                  (args[1].headers as Record<string, string>)[
                    customCookieHeader
                  ] = cookies;
                }
              }
            } catch (error) {
              console.error(error);
            }
            return originalFetch.apply(this, args);
          };
        }
      }

      function shouldSyncCookies(url: string): boolean {
        const anchor = document.createElement("a");
        anchor.href = url;
        return domainsToSync.some((domain) => anchor.hostname.includes(domain));
      }

      function getCookiesToSync(): string {
        return document.cookie
          .split(/;\s?/)
          .filter((cookie) => cookiesToSync.includes(cookie.split("=")[0]))
          .join("; ");
      }
    })();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      
        <AuthProvider>
          <Layout>
          <Component {...pageProps} />
          </Layout>
        </AuthProvider>
     
    </QueryClientProvider>
  );
}
