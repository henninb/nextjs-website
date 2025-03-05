import React from "react";
import { FinanceThemeProvider } from "../components/FinanceThemeProvider";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FinanceThemeProvider>{children}</FinanceThemeProvider>;
}
