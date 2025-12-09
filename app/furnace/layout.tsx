import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Furnace Monitor",
  description: "Monitor and track furnace temperature and performance metrics.",
};

export default function FurnaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
