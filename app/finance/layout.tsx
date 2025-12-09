import React from "react";
import FinanceLayoutWrapper from "../../layouts/FinanceLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Finance Management",
    template: "%s | Finance App",
  },
  description: "Personal finance management application for tracking transactions, payments, and budgets.",
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FinanceLayoutWrapper>{children}</FinanceLayoutWrapper>;
}
