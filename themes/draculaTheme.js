import { createTheme } from "@mui/material/styles";

export const draculaTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#BD93F9", // Soft purple
    },
    secondary: {
      main: "#FF79C6", // Vibrant pink
    },
    background: {
      default: "#1E1F29", // Darker shade for better contrast
      paper: "#2A2B3A", // Slightly lighter for card-like elements
    },
    text: {
      primary: "#F8F8F2", // Softer white
      secondary: "#8BE9FD", // Light blue for accents
    },
    divider: "#44475A", // Consistent with Dracula
  },
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#2A2B3A",
          color: "#F8F8F2",
          borderColor: "#BD93F9",
          borderRadius: "8px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
        columnHeader: {
          backgroundColor: "#3A3C4E",
          color: "#F8F8F2",
          fontWeight: "bold",
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
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Darken backdrop
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#2A2B3A", // Ensures modal content is dark
          color: "#F8F8F2",
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
          backgroundColor: "#282A36",
          color: "#F8F8F2",
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
      },
    },
  },
});