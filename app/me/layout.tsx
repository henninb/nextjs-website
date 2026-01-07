import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Profile",
  description: "View and manage your personal profile and account settings.",
};

export default function MeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
