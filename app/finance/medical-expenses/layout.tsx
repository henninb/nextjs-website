import React from "react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Medical Expenses Tracker",
  description:
    "Track medical expenses and healthcare costs. Manage family member medical records and expense history.",
};

export default function MedicalExpensesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
