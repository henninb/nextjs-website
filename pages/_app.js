import '../styles/index.css';
import Layout from '../components/Layout';

export default function MyApp({ Component, pageProps }) {
    return (
      <div>
        <Layout>
            <Component {...pageProps} />
        </Layout>
      </div>
    );
}
