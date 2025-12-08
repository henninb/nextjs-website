import React from "react";
import BlogThemeProvider from "./BlogThemeProvider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Dev Insights Blog",
    template: "%s | Dev Insights Blog",
  },
  description: "Modern web development insights, best practices, and tutorials",
};

export default function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BlogThemeProvider>{children}</BlogThemeProvider>;
}
