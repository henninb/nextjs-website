import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Secure Payment",
  description: "Process your payment securely with SSL encryption and PCI compliance.",
};

export default function PaymentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
