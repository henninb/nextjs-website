import "../styles/index.css";
import Layout from "../components/Layout";
import AuthProvider from "../components/AuthProvider";
// import AuthProvider from "../components/AuthProvider";

export default function MyApp({ Component, pageProps }) {
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
