import "../styles/index.css";
import Layout from "../components/Layout";
import AuthProvider from "../components/AuthProvider";
import { useEffect } from 'react';
// import AuthProvider from "../components/AuthProvider";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    window._pxCustomAbrDomains = ["amazonaws.com", "execute-api.us-east-1.amazonaws.com"];
    !function() {
    // Configuration
    var customCookieHeader = "x-px-cookies";
    var cookiesToSync = ["_px2", "_px3", "_pxhd", "_pxvid", "pxcts"];
    var domainsToSync = ["amazonaws.com", "execute-api.us-east-1.amazonaws.com"];
    // Implementation
    var e=customCookieHeader,t=cookiesToSync,n=domainsToSync;if(e&&t.length&&n.length){var r=XMLHttpRequest.prototype.open;if(XMLHttpRequest.prototype.open=function(){r.apply(this,arguments);try{if(c(arguments[1])){var t=o();t&&this.setRequestHeader(e,t)}}catch(n){}},window.fetch){var i=window.fetch;window.fetch=function(){try{if(c(arguments[0])){var t=o();t&&(arguments[1]||1!==arguments.length||(arguments[1]={},arguments.length=2),arguments[1].headers||(arguments[1].headers={}),arguments[1].headers[e]=t)}}catch(n){}return i.apply(this,arguments)}}}function c(e){var t=document.createElement("a");return t.href=e,n.some(function(e){return t.hostname.indexOf(e)>-1})}function o(){return document.cookie.split(/;\s?/).reduce(function(e,n){var r=n.split("=")[0];return t.indexOf(r)>-1&&(e+=n+"; "),e},"").slice(0,-2)}
}
();
  }, []);

  return (
    <div>
      <Layout>
        <AuthProvider>
          <Component {...pageProps} />
        </AuthProvider>
      </Layout>
    </div>
  );
}
