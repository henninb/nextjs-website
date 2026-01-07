import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Payment Management",
  description:
    "Track and manage all your payments. View payment history, schedule future payments, and analyze payment trends.",
};

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
