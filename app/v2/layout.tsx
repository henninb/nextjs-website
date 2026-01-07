import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "V2 Features",
    template: "%s | Finance App",
  },
  description: "Access next-generation features and improved functionality.",
};

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
