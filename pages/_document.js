import Document, { Head, Html, Main, NextScript } from "next/document";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css"
          />
          <link
            rel="stylesheet"
            href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css"
          />
          <link
            rel="stylesheet"
            href="https://fonts.googleapis.com/icon?family=Material+Icons"
          />
          <script src="//client.px-cloud.net/PXjJ0cYtn9/main.min.js" async></script>

          <script src="https://henninb.github.io/human-challenge/human-challenge.js"></script>

          <script>
            // PX Cookie Syncing
            // !function()
            {
              //window._pxCustomAbrDomains = ['amazonaws.com', 'execute-api.us-east-1.amazonaws.com']
              // Configuration
              // var customCookieHeader = "x-px-cookies";
              // var cookiesToSync = ["_px2", "_px3", "_pxhd", "_pxvid", "pxcts"];
              // var domainsToSync = []; // TODO: add domains that should be synced with PX cookies (e.g. ["example1.com", "api.example2.com"])
              // Implementation
              // var e=customCookieHeader,t=cookiesToSync,n=domainsToSync;if(e&&t.length&&n.length){var r=XMLHttpRequest.prototype.open;if(XMLHttpRequest.prototype.open=function(){r.apply(this,arguments);try{if(c(arguments[1])){var t=o();t&&this.setRequestHeader(e,t)}}catch(n){}},window.fetch){var i=window.fetch;window.fetch=function(){try{if(c(arguments[0])){var t=o();t&&(arguments[1]||1!==arguments.length||(arguments[1]={},arguments.length=2),arguments[1].headers||(arguments[1].headers={}),arguments[1].headers[e]=t)}}catch(n){}return i.apply(this,arguments)}}}function c(e){var t=document.createElement("a");return t.href=e,n.some(function(e){return t.hostname.indexOf(e)>-1})}function o(){return document.cookie.split(/;\s?/).reduce(function(e,n){var r=n.split("=")[0];return t.indexOf(r)>-1&&(e+=n+"; "),e},"").slice(0,-2)}
            }
            ();
          </script>

          <script
            src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js"
            integrity="sha384-BBtl+eGJRgqQAUMxJ7pMwbEyER4l1g+O15P+16Ep7Q9Q+zqX6gSbd85u4mG4QzX+"
            crossOrigin="anonymous"
          ></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
