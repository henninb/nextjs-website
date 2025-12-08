import "../styles/index.css";
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
    <html lang="en">
      <head>
        {/* PX event handler - must be defined before PX script loads */}
        <Script
          id="px-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.PXjJ0cYtn9_asyncInit = function (px) {
                px.Events.on('score', function (score, kind) {
                  // kind - "hashed" for "Hashed Score" or "binary" for "Block Decision"
                  console.log('kind', kind);
                  console.log('SCORE', score);
                });

                px.Events.on('risk', function (risk, name) {
                  // name - reported cookie name (ex: _px)
                  console.log('DATA', risk);
                });
              };
            `,
          }}
        />

        {/* PX script with identifiers for runtime diagnostics */}
        <Script
          id="px-script"
          data-app-id="PXjJ0cYtn9"
          src="//client.px-cloud.net/PXjJ0cYtn9/main.min.js"
          strategy="afterInteractive"
        />

        {/* Lightweight inline diagnostic to mark DOM ready and capture initial errors */}
        <Script
          id="px-diag"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                try {
                  var mark = '[PX-DIAG]';
                  console.log(mark, 'Document <Head> scripts rendering');
                  var s = document.getElementById('px-script');
                  if (s) {
                    console.log(mark, 'Found px-script tag', {
                      src: s.getAttribute('src'),
                      async: s.async,
                      defer: s.defer,
                      dataset: s.dataset && s.dataset.appId,
                    });
                    s.addEventListener('load', function(){
                      console.log(mark, 'px-script load event fired');
                    });
                    s.addEventListener('error', function(e){
                      console.error(mark, 'px-script error event', e);
                    });
                  } else {
                    console.warn(mark, 'px-script tag not found in DOM');
                  }
                } catch (e) {
                  console.error('[PX-DIAG] Inline diag error', e);
                }
              })();
            `,
          }}
        />

        <Script
          src="https://henninb.github.io/human-challenge/human-challenge.js"
          strategy="afterInteractive"
        />
        <Script
          type="application/javascript"
          src="https://henninb.github.io/human-challenge/hello.js"
          strategy="afterInteractive"
        />

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </head>
      <body>
        <ErrorBoundary>
          <Providers>
            <Layout>
              <ErrorBoundary>{children}</ErrorBoundary>
            </Layout>
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
}
