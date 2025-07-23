import { createTheme } from "@mui/material/styles";

export const modernTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#3b82f6", // Modern bright blue
      light: "#60a5fa",
      dark: "#2563eb",
    },
    secondary: {
      main: "#10b981", // Modern emerald green
      light: "#34d399",
      dark: "#059669",
    },
    background: {
      default: "#0f172a", // Very dark slate
      paper: "#1e293b", // Dark slate for cards
    },
    text: {
      primary: "#f8fafc", // Near white for main text
      secondary: "#cbd5e1", // Light slate for secondary text
    },
    divider: "#334155", // Medium slate for borders
    success: {
      main: "#22c55e",
      light: "#4ade80",
      dark: "#16a34a",
    },
    warning: {
      main: "#f59e0b",
      light: "#fbbf24",
      dark: "#d97706",
    },
    error: {
      main: "#ef4444",
      light: "#f87171",
      dark: "#dc2626",
    },
  },
  typography: {
    fontFamily:
      '"Inter", "Segoe UI", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.6,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0f172a",
          backgroundImage:
            "radial-gradient(circle at 25px 25px, rgba(59, 130, 246, 0.08) 2%, transparent 0%), radial-gradient(circle at 75px 75px, rgba(16, 185, 129, 0.06) 2%, transparent 0%)",
          backgroundSize: "100px 100px",
        },
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e293b",
          borderRadius: "16px",
          border: "1px solid #334155",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
          overflow: "hidden",
          "& .MuiDataGrid-cell": {
            borderBottom: "1px solid #334155",
            color: "#f8fafc",
          },
          "& .MuiDataGrid-columnHeaders": {
            backgroundColor: "#0f172a",
            borderBottom: "2px solid #3b82f6",
          },
          "& .MuiDataGrid-columnHeaderTitle": {
            fontWeight: 600,
            color: "#3b82f6",
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
        },
        columnHeaders: {
          backgroundColor: "#0f172a",
          color: "#3b82f6",
          fontWeight: 600,
          borderBottom: "2px solid #3b82f6",
        },
        row: {
          "&:nth-of-type(even)": {
            backgroundColor: "#1a2332",
          },
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.1) !important",
            transition: "background-color 0.2s ease-in-out",
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1e293b",
          borderRadius: "16px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
          border: "1px solid #334155",
        },
      },
    },

    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 500,
          padding: "10px 20px",
          fontSize: "0.875rem",
          boxShadow: "none",
          "&:hover": {
            boxShadow:
              "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
          },
        },
        contained: {
          background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          color: "#f8fafc",
          "&:hover": {
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
          },
        },
        outlined: {
          borderColor: "#334155",
          color: "#cbd5e1",
          "&:hover": {
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: "10px",
          padding: "8px",
          color: "#cbd5e1",
          backgroundColor: "transparent",
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            color: "#3b82f6",
            transform: "translateY(-1px)",
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          backgroundColor: "#1e293b",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
          border: "1px solid #334155",
          overflow: "hidden",
        },
      },
    },

    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            "&:hover fieldset": {
              borderColor: "#475569",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#3b82f6",
              borderWidth: "2px",
            },
          },
          "& .MuiOutlinedInput-input": {
            padding: "12px 14px",
            color: "#f8fafc",
          },
          "& .MuiInputLabel-root": {
            color: "#cbd5e1",
            "&.Mui-focused": {
              color: "#3b82f6",
            },
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#475569",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#3b82f6",
            borderWidth: "2px",
          },
        },
        icon: {
          color: "#cbd5e1",
        },
      },
    },

    MuiAutocomplete: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
          },
        },
        paper: {
          borderRadius: "12px",
          backgroundColor: "#1e293b",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
          border: "1px solid #334155",
        },
        option: {
          color: "#f8fafc",
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(59, 130, 246, 0.2)",
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
          backdropFilter: "blur(8px)",
        },
      },
    },

    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: "separate",
          borderSpacing: 0,
        },
      },
    },

    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: "16px",
          overflow: "hidden",
          backgroundColor: "#1e293b",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
          border: "1px solid #334155",
        },
      },
    },

    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#0f172a",
          "& .MuiTableCell-head": {
            fontWeight: 600,
            color: "#3b82f6",
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "2px solid #3b82f6",
          },
        },
      },
    },

    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(even)": {
            backgroundColor: "#1a2332",
          },
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #334155",
          padding: "12px 16px",
          color: "#f8fafc",
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: "#3b82f6",
          textDecoration: "none",
          fontWeight: 500,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            color: "#60a5fa",
            textDecoration: "underline",
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0f172a",
          color: "#f8fafc",
          fontSize: "0.75rem",
          borderRadius: "8px",
          padding: "6px 12px",
          boxShadow:
            "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)",
          border: "1px solid #334155",
        },
        arrow: {
          color: "#0f172a",
        },
      },
    },

    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "8px",
          fontWeight: 500,
          fontSize: "0.75rem",
        },
        filled: {
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          color: "#3b82f6",
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.2)",
          },
        },
      },
    },

    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1e293b",
          color: "#f8fafc",
          border: "1px solid #334155",
          boxShadow:
            "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "#f8fafc",
          "&:hover": {
            backgroundColor: "rgba(59, 130, 246, 0.1)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(59, 130, 246, 0.2)",
            "&:hover": {
              backgroundColor: "rgba(59, 130, 246, 0.3)",
            },
          },
        },
      },
    },
  },
});
