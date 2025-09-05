import Document, {
  DocumentContext,
  DocumentInitialProps,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import React from "react";

export default function MyDocument() {
  return (
    <Html>
      <Head>
        {/* PX script with identifiers for runtime diagnostics */}
        <script
          id="px-script"
          data-app-id="PXjJ0cYtn9"
          src="//client.px-cloud.net/PXjJ0cYtn9/main.min.js"
          async
        ></script>

        {/* Lightweight inline diagnostic to mark DOM ready and capture initial errors */}
        <script
          // eslint-disable-next-line react/no-danger
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

        <script
          src="https://henninb.github.io/human-challenge/human-challenge.js"
          async
        ></script>
        <script
          type="application/javascript"
          src="https://henninb.github.io/human-challenge/hello.js"
          async
        ></script>

        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/icon?family=Material+Icons"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

MyDocument.getInitialProps = async (
  ctx: DocumentContext,
): Promise<DocumentInitialProps> => {
  const initialProps = await Document.getInitialProps(ctx);
  return { ...initialProps };
};
