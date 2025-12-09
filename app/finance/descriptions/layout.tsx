import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction Descriptions",
  description: "Manage transaction descriptions and merchant names. Organize and categorize your transaction history.",
};

export default function DescriptionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
