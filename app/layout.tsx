import "../styles/index.css";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import { Providers } from "./providers";
import Layout from "../components/Layout";
import ErrorBoundary from "../components/ErrorBoundary";
import Script from "next/script";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Finance App",
    template: "%s | Finance App",
  },
  description: "Personal finance management application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body suppressHydrationWarning>
        <AppRouterCacheProvider>
          <ErrorBoundary>
            <Providers>
              <Layout>
                <ErrorBoundary>{children}</ErrorBoundary>
              </Layout>
            </Providers>
          </ErrorBoundary>
        </AppRouterCacheProvider>
        <Script
          id="px-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.PXjJ0cYtn9_asyncInit = function (px) {
                px.Events.on('score', function (score, kind) {
                  console.log('kind', kind);
                  console.log('SCORE', score);
                });
                px.Events.on('risk', function (risk, name) {
                  console.log('DATA', risk);
                });
              };
            `,
          }}
        />
        <Script
          id="px-script"
          data-app-id="PXjJ0cYtn9"
          src="//client.px-cloud.net/PXjJ0cYtn9/main.min.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://henninb.github.io/human-challenge/human-challenge.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://henninb.github.io/human-challenge/hello.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
