"use client";

import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { modernTheme } from "../themes/modernTheme";
import React, { ReactNode } from "react";

interface FinanceThemeProviderProps {
  children: ReactNode;
}

export const FinanceThemeProvider = ({
  children,
}: FinanceThemeProviderProps) => {
  return (
    <ThemeProvider theme={modernTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
