import { Metadata } from "next";

export const metadata: Metadata = {
  title: "How-To Guides - Brian Henning",
  description:
    "Technical guides and tutorials for Docker, Cloudflare, Debian, NextJS, Proxmox, pfSense, and more",
  openGraph: {
    title: "How-To Guides - Brian Henning",
    description:
      "Technical guides and tutorials for Docker, Cloudflare, Debian, NextJS, Proxmox, pfSense, and more",
  },
};

export default function HowtoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
