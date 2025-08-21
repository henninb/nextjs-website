import React from "react";
import { Box } from "@mui/material";

type ActionBarProps = {
  children?: React.ReactNode;
};

export default function ActionBar({ children }: ActionBarProps) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", mb: 2 }}>
      {children}
    </Box>
  );
}
