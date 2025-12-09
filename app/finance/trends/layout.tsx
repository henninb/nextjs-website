import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Financial Trends & Analytics",
  description: "Analyze your financial trends and spending patterns. View charts and insights for better financial planning.",
};

export default function TrendsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
