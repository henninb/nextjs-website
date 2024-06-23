import Head from 'next/head';
import Link from 'next/link';

export default function Howto() {
  return (
    <div>
      <Head>
        <title>Howto - Brian Henning</title>
      </Head>
      <h1>Howto</h1>
      <p>For detailed Docker instructions, please visit the Docker Howto page.</p>
      <Link href="/howto/docker">Go to Docker Howto</Link>
    </div>
  );
}