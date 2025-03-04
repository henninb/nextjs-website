import React from "react";
import Head from "next/head";
import Link from "next/link";

export default function Howto() {
  return (
    <div>
      <Head>
        <title>Howto - Brian Henning</title>
      </Head>
      <h1>Howto</h1>
      <ul>
        <li>
          <Link href="/howto/docker">Docker</Link>
        </li>
        <li>
          <Link href="/howto/cloudflare">Cloudflare</Link>
        </li>
        <li>
          <Link href="/howto/debian">Debian</Link>
        </li>
        <li>
          <Link href="/howto/f5">F5</Link>
        </li>
        <li>
          <Link href="/howto/gentoo">Gentoo</Link>
        </li>
        <li>
          <Link href="/howto/nextjs">NextJS</Link>
        </li>
        <li>
          <Link href="/howto/proxmox">Proxmox</Link>
        </li>
        <li>
          <Link href="/howto/pfsense">pfSense</Link>
        </li>
      </ul>
    </div>
  );
}
