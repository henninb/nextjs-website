import React from "react";
import { Box } from "@mui/material";

export default function ContentContainer({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ display: "flex", justifyContent: "center" }}>
      <Box sx={{ width: "100%", maxWidth: "1200px" }}>{children}</Box>
    </Box>
  );
}
