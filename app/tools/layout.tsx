import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Tools & Utilities",
  description:
    "Collection of useful online tools for developers, network analysis, and productivity",
  openGraph: {
    title: "Developer Tools & Utilities",
    description:
      "Collection of useful online tools for developers, network analysis, and productivity",
  },
};

export default function ToolsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
