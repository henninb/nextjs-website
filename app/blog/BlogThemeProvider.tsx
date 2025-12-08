"use client";

import React from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";

// Create a default theme for blog pages
const blogTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#6366f1",
    },
    secondary: {
      main: "#8b5cf6",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function BlogThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider theme={blogTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}
