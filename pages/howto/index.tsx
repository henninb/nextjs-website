import Head from "next/head";
//import 'bootstrap/dist/css/bootstrap.min.css';
//import '@fortawesome/fontawesome-free/css/all.min.css';

export default function Howto() {
  return (
    <div>
      <Head>
        <title>Howto - Brian Henning</title>
      </Head>
      <h1>Docker</h1>
      list docker logs
      <pre>
        <code>docker logs container</code>
      </pre>
    </div>
  );
}
