import React from "react";
import {
  ThemeProvider,
  CssBaseline,
  Container,
  Box,
  Paper,
  Typography,
} from "@mui/material";
import { leadTheme } from "../../../styles/leadTheme";
import LeadProgressStepper from "./LeadProgressStepper";

export default function LeadLayout({
  children,
  activeStep = 0,
  title,
  subtitle,
}) {
  return (
    <ThemeProvider theme={leadTheme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: "100vh",
          background: `linear-gradient(135deg, ${leadTheme.palette.primary.light} 0%, ${leadTheme.palette.primary.main} 50%, ${leadTheme.palette.primary.dark} 100%)`,
          py: 4,
        }}
      >
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Typography
              variant="h2"
              sx={{
                color: "white",
                fontWeight: 700,
                mb: 1,
                textShadow: "0 2px 4px rgba(0,0,0,0.3)",
              }}
            >
              {title || "Vehicle Lead Generator"}
            </Typography>
            {subtitle && (
              <Typography
                variant="h6"
                sx={{
                  color: "rgba(255,255,255,0.9)",
                  fontWeight: 400,
                  textShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>

          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, sm: 4, md: 6 },
              borderRadius: 4,
              backgroundColor: leadTheme.palette.background.paper,
              boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
            }}
          >
            <LeadProgressStepper activeStep={activeStep} />
            {children}
          </Paper>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
