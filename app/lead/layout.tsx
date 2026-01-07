import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Vehicle Lead Form",
    template: "%s | Finance App",
  },
  description:
    "Complete your vehicle information and contact details to receive a personalized quote.",
};

export default function LeadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
