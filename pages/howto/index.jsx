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
      <Link href="/howto/docker">Docker</Link>
      <Link href="/howto/cloudflare">Cloudflare</Link>
      <Link href="/howto/debian">Debian</Link>
      <Link href="/howto/f5">F5</Link>
      <Link href="/howto/gentoo">Gentoo</Link>
      <Link href="/howto/nextjs">NextJS</Link>
      <Link href="/howto/proxmox">Proxmox</Link>
      <Link href="/howto/pfsense">pfSense</Link>
    </div>
  );
}
