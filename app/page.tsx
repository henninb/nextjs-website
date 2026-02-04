import React from "react";
import type { Metadata } from "next";
import LandingPageContent from "../components/LandingPageContent";

export const metadata: Metadata = {
  title: "bhenning.com - Bot Protection & Security",
  description:
    "Advanced bot detection and human verification protecting bhenning.com from automated threats.",
  keywords: [
    "bot protection",
    "cybersecurity",
    "PerimeterX",
    "bot detection",
    "human verification",
    "bhenning.com",
  ],
  openGraph: {
    title: "bhenning.com - Bot Protection & Security",
    description:
      "Advanced bot detection and human verification protecting bhenning.com from automated threats.",
    type: "website",
  },
};

export default function HomePage() {
  return <LandingPageContent />;
}
