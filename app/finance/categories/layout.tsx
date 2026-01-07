import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction Categories",
  description:
    "Manage and organize your transaction categories. Create, update, and delete categories for better expense tracking.",
};

export default function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
