import { createTheme } from "@mui/material/styles";

export const leadTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#1976d2", // Professional blue
      light: "#42a5f5",
      dark: "#1565c0",
      contrastText: "#fff",
    },
    secondary: {
      main: "#ff9800", // Orange accent for highlights
      light: "#ffb74d",
      dark: "#f57c00",
      contrastText: "#fff",
    },
    background: {
      default: "#f8fafc", // Light gray background
      paper: "#ffffff",
    },
    text: {
      primary: "#1a202c",
      secondary: "#4a5568",
    },
    success: {
      main: "#4caf50",
      light: "#81c784",
      dark: "#388e3c",
    },
    error: {
      main: "#f44336",
      light: "#ef5350",
      dark: "#d32f2f",
    },
    warning: {
      main: "#ff9800",
      light: "#ffb74d",
      dark: "#f57c00",
    },
    info: {
      main: "#2196f3",
      light: "#64b5f6",
      dark: "#1976d2",
    },
    divider: "#e2e8f0",
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#1a202c",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#1a202c",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#1a202c",
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.5,
      color: "#1a202c",
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#4a5568",
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#4a5568",
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          textTransform: "none",
          fontWeight: 600,
          padding: "12px 24px",
          fontSize: "1rem",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          "&:hover": {
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.15)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #1976d2 0%, #1565c0 100%)",
          "&:hover": {
            background: "linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)",
          },
        },
        outlined: {
          borderWidth: "2px",
          "&:hover": {
            borderWidth: "2px",
            backgroundColor: "rgba(25, 118, 210, 0.04)",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
          border: "1px solid #e2e8f0",
          "&:hover": {
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.12)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#ffffff",
            "&:hover fieldset": {
              borderColor: "#1976d2",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#1976d2",
              borderWidth: "2px",
            },
          },
          "& .MuiInputLabel-root": {
            fontWeight: 500,
            "&.Mui-focused": {
              color: "#1976d2",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          backgroundColor: "#ffffff",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1976d2",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#1976d2",
            borderWidth: "2px",
          },
        },
      },
    },
    MuiStepper: {
      styleOverrides: {
        root: {
          padding: "24px 0",
        },
      },
    },
    MuiStepLabel: {
      styleOverrides: {
        label: {
          fontSize: "0.875rem",
          fontWeight: 500,
          "&.Mui-active": {
            color: "#1976d2",
            fontWeight: 600,
          },
          "&.Mui-completed": {
            color: "#4caf50",
            fontWeight: 500,
          },
        },
      },
    },
    MuiStepIcon: {
      styleOverrides: {
        root: {
          fontSize: "1.5rem",
          "&.Mui-active": {
            color: "#1976d2",
          },
          "&.Mui-completed": {
            color: "#4caf50",
          },
        },
      },
    },
  },
});
