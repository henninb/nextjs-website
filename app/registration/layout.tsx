import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Registration",
  description: "Create your account by completing the registration form.",
};

export default function RegistrationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
