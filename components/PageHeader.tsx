import React from "react";
import { Box, Typography } from "@mui/material";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
};

export default function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Box sx={{ mb: 3, textAlign: "center" }}>
      <Typography variant="h4" component="h1" sx={{ mb: 1, fontWeight: 600 }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
          {subtitle}
        </Typography>
      )}
      {actions && <Box sx={{ display: "flex", justifyContent: "center" }}>{actions}</Box>}
    </Box>
  );
}

