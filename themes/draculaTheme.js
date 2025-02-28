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

  MuiListItemIcon: {
    styleOverrides: {
      root: {
        color: "rgba(255, 121, 198, 1)", // Set icon color to pink (or another color from the theme)
        "&:hover": {
          color: "rgba(139, 233, 253, 1)", // Light blue hover effect
        },
      },
    },
  },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(42, 43, 58, 0.9)", // Set tooltip background
          color: "rgba(80, 250, 123, 1)", // Soft green text for tooltips
          fontSize: "0.875rem",
          borderRadius: "4px",
          padding: "4px 8px",
        },
        arrow: {
          color: "rgba(42, 43, 58, 0.9)", // Match arrow color with tooltip background
        },
      },
    },
    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)", // Base background color for the grid
          color: "rgba(248, 248, 242, 1)", // Text color for the grid
          borderColor: "rgba(189, 147, 249, 1)", // Purple border for the grid
          borderRadius: "8px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
        columnHeaders: {
          backgroundColor: "rgba(58, 60, 78, 1)", // Dark background for headers
          color: "rgba(139, 233, 253, 1)", // Light blue text for headers
          fontWeight: "bold",
          borderBottom: "2px solid rgba(189, 147, 249, 1)", // Purple border below headers
          textTransform: "uppercase",
        },
        row: {
          "&:nth-of-type(even)": {
            backgroundColor: "rgba(50, 52, 70, 1)", // Slightly lighter Dracula background
          },
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(42, 43, 58, 1)", // Default Dracula background
          },
          "&:hover": {
            backgroundColor: "rgba(68, 71, 90, 1) !important", // Dracula slightly brighter hover effect
            transition: "background-color 0.2s ease-in-out",
          },
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
          //width: 400,
          margin: "auto",
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
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "rgba(255, 121, 198, 1)",
          "&:hover": {
            color: "rgba(139, 233, 253, 1)",
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)", // Dropdown button background
          color: "rgba(248, 248, 242, 1)", // Text color
          "&:hover": {
            borderColor: "rgba(189, 147, 249, 1)", // Purple on hover
          },
          "&.Mui-focused": {
            borderColor: "rgba(255, 121, 198, 1)", // Pink border on focus
            boxShadow: "0 0 5px rgba(255, 121, 198, 0.5)",
          },
        },
        icon: {
          color: "rgba(139, 233, 253, 1)", // Light blue arrow icon
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "rgba(40, 42, 54, 1)", // Dark background
          color: "rgba(248, 248, 242, 1)", // Text color
          borderRadius: "6px", // Smooth rounded corners
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.5)", // Softer and more pronounced shadow
          border: "1px solid rgba(68, 71, 90, 1)", // Subtle border with a matching color to the theme
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          color: "rgba(248, 248, 242, 1)", // Dracula foreground color
          "&.Mui-selected": {
            backgroundColor: "rgba(189, 147, 249, 0.3)", // Soft purple highlight
            color: "rgba(248, 248, 242, 1)",
          },
          "&:hover": {
            //backgroundColor: "rgba(80, 250, 123, 0.3)", // Green hover effect
            backgroundColor: "transparent", // Remove background color on hover
            textDecoration: "underline", // Underline effect on hover
          },
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(189, 147, 249, 0.3)", // Soft purple highlight
            color: "rgba(248, 248, 242, 1)",
          },
          "&:hover": {
            backgroundColor: "rgba(80, 250, 123, 0.3)", // Green hover effect
          },
        },
      },
    },
  },
});
