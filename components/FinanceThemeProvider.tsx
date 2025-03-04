import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { draculaTheme } from "../themes/draculaTheme";
import React, { ReactNode } from "react";

interface FinanceThemeProviderProps {
  children: ReactNode;
}

export const FinanceThemeProvider = ({
  children,
}: FinanceThemeProviderProps) => {
  return (
    <ThemeProvider theme={draculaTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
