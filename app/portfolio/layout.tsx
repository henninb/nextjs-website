import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Brian Henning - Portfolio",
  description:
    "Solutions engineer based in Minneapolis specializing in software development, technical sales, and cybersecurity.",
};

export default function PortfolioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
