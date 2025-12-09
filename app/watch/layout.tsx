import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Monitor",
  description: "Real-time system monitoring and performance metrics dashboard.",
};

export default function WatchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
