import { createTheme } from "@mui/material/styles";

export const draculaTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "rgba(189, 147, 249, 1)", // Soft purple
    },
    secondary: {
      main: "rgba(255, 121, 198, 1)", // Vibrant pink
    },
    background: {
      default: "rgba(30, 31, 41, 1)", // Darker shade for better contrast
      paper: "rgba(42, 43, 58, 1)", // Slightly lighter for card-like elements
    },
    text: {
      primary: "rgba(248, 248, 242, 1)",
      secondary: "rgba(139, 233, 253, 1)",
    },
    divider: "rgba(68, 71, 90, 1)",
  },
  components: {
    MuiTooltip: { // Tooltip styles *must* come before components that might contain tooltips
      styleOverrides: ({ theme }) => ({
        tooltip: {
          backgroundColor: 'rgba(42, 43, 58, 0.9)',
          color: theme.palette.text.primary,
          fontSize: '0.875rem',
          borderRadius: '4px',
          padding: '4px 8px',
        },
        arrow: {
          color: 'rgba(42, 43, 58, 0.9)',
        },
      }),
    },
    MuiIconButton: {
      styleOverrides: ({ theme }) => ({
        root: {
          color: "rgba(189, 147, 249, 1)",
          "&:hover": {
            backgroundColor: "rgba(189, 147, 249, 0.2)",
          },
          "& .MuiSvgIcon-root": {
            color: "rgba(255, 121, 198, 1)",
          },
        },
      }),
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)",
          color: "rgba(248, 248, 242, 1)",
          borderColor: "rgba(189, 147, 249, 1)",
          borderRadius: "8px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
        columnHeaders: {
          backgroundColor: "rgba(58, 60, 78, 1)",
          color: "rgba(139, 233, 253, 1)",
          fontWeight: "bold",
          borderBottom: "2px solid rgba(189, 147, 249, 1)",
          textTransform: "uppercase",
        },
      },
    },
    MuiLink: {
      styleOverrides: {
        root: {
          color: "rgba(80, 250, 123, 1)",
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
            color: "rgba(139, 233, 253, 1)",
          },
        },
      },
    },
    MuiModal: {
      styleOverrides: {
        root: {
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        },
      },
    },
    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0, 0, 0, 0.7)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)",
          color: "rgba(248, 248, 242, 1)",
          borderRadius: "10px",
          padding: "24px",
          boxShadow: "0px 6px 12px rgba(0, 0, 0, 0.3)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "6px",
          textTransform: "none",
          fontWeight: "bold",
          padding: "8px 16px",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(40, 42, 54, 1)",
          color: "rgba(248, 248, 242, 1)",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: {
          fontSize: "1.5rem",
        },
        colorError: {
          color: "rgba(255, 85, 85, 1)",
        },
      },
    },
  },
});