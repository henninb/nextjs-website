import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Account Configuration",
  description: "Configure your financial accounts and settings. Manage account details and preferences.",
};

export default function ConfigurationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
