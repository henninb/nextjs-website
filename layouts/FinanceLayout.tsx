"use client";

import React from "react";
import { FinanceThemeProvider } from "../components/FinanceThemeProvider";
import { UIProvider } from "../contexts/UIContext";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UIProvider>
      <FinanceThemeProvider>{children}</FinanceThemeProvider>
    </UIProvider>
  );
}
