import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transfer Management",
  description:
    "Manage transfers between accounts. Track transfer history and reconcile account balances.",
};

export default function TransfersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
