import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { draculaTheme } from "../themes/draculaTheme";
import { modernTheme } from "../themes/modernTheme";
import { useUI } from "../contexts/UIContext";
import React, { ReactNode } from "react";

interface FinanceThemeProviderProps {
  children: ReactNode;
}

export const FinanceThemeProvider = ({
  children,
}: FinanceThemeProviderProps) => {
  const { uiMode } = useUI();
  const theme = uiMode === "modern" ? modernTheme : draculaTheme;

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
