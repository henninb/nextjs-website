import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Transactions",
    template: "%s | Finance App",
  },
  description:
    "View and manage your financial transactions. Filter by account, category, or description for detailed analysis.",
};

export default function TransactionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
