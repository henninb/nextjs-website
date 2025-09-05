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
        <script
          src="//client.px-cloud.net/PXjJ0cYtn9/main.min.js"
          async
        ></script>

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
