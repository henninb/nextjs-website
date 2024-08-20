import "../styles/index.css";
import Layout from "../components/Layout";
import AuthProvider from "../components/AuthProvider";
import { useEffect } from 'react';
// import AuthProvider from "../components/AuthProvider";

export default function MyApp({ Component, pageProps }) {
  useEffect(() => {
    window._pxCustomAbrDomains = ['amazonaws.com', 'execute-api.us-east-1.amazonaws.com'];
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
