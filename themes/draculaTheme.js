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
      primary: "rgba(248, 248, 242, 1)", // Light text for general readability
      secondary: "rgba(139, 233, 253, 1)", // Light blue text for emphasis
    },
    divider: "rgba(68, 71, 90, 1)", // Subtle divider to maintain dark mode feel
  },
  components: {
    MuiListItemIcon: {
      styleOverrides: {
        root: {
          color: "rgba(139, 233, 253, 1)", // Light blue for icons (to contrast with pink)
          "&:hover": {
            color: "rgba(80, 250, 123, 1)", // Green hover effect for icons
          },
        },
      },
    },

    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "rgba(42, 43, 58, 0.9)", // Tooltips match the background for consistency
          color: "rgba(80, 250, 123, 1)", // Green text in tooltips
          fontSize: "0.875rem",
          borderRadius: "4px",
          padding: "4px 8px",
        },
        arrow: {
          color: "rgba(42, 43, 58, 0.9)", // Tooltip arrow background matches tooltip
        },
      },
    },

    MuiDataGrid: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)", // Grid background color
          color: "rgba(248, 248, 242, 1)", // Text color inside the grid
          borderColor: "rgba(189, 147, 249, 1)", // Purple border for consistency
          borderRadius: "8px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
        columnHeaders: {
          backgroundColor: "rgba(58, 60, 78, 1)", // Slightly lighter background for headers
          color: "rgba(139, 233, 253, 1)", // Light blue text for headers
          fontWeight: "bold",
          borderBottom: "2px solid rgba(189, 147, 249, 1)", // Purple divider under headers
          textTransform: "uppercase",
        },
        row: {
          "&:nth-of-type(even)": {
            backgroundColor: "rgba(50, 52, 70, 1)", // Lighter row background for better contrast
          },
          "&:nth-of-type(odd)": {
            backgroundColor: "rgba(42, 43, 58, 1)", // Default Dracula background
          },
          "&:hover": {
            backgroundColor: "rgba(80, 250, 123, 0.1) !important", // Green hover effect
            transition: "background-color 0.2s ease-in-out",
          },
        },
      },
    },

    MuiLink: {
      styleOverrides: {
        root: {
          color: "rgba(80, 250, 123, 1)", // Soft green links
          textDecoration: "none",
          "&:hover": {
            textDecoration: "underline",
            color: "rgba(139, 233, 253, 1)", // Light blue on hover
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
          backgroundColor: "rgba(0, 0, 0, 0.7)", // Dark backdrop
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)", // Default paper background color
          color: "rgba(248, 248, 242, 1)", // Light text for papers
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
          //fontWeight: "bold",
          padding: "8px 16px",
          backgroundColor: "rgba(189, 147, 249, 1)", // Purple background for buttons
          //backgroundColor: "rgba(255, 121, 198, 1)", // Pink background for primary buttons
          color: "rgba(248, 248, 242, 1)", // Light text on buttons
          "&:hover": {
            backgroundColor: "rgba(189, 147, 249, 0.9)", // Purple background for buttons
            textDecoration: "underline",
            //backgroundColor: "rgba(255, 121, 198, 0.9)", // Slightly darker pink on hover
          },
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(40, 42, 54, 1)", // Dark card background
          color: "rgba(248, 248, 242, 1)", // Light text for cards
          borderRadius: "12px",
          padding: "16px",
          boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.2)",
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: "rgba(139, 233, 253, 1)", // Light blue icon buttons
          "&:hover": {
            color: "rgba(80, 250, 123, 1)", // Green hover effect for icon buttons
          },
        },
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(42, 43, 58, 1)", // Dropdown background
          color: "rgba(248, 248, 242, 1)", // Text color for dropdowns
          "&:hover": {
            borderColor: "rgba(189, 147, 249, 1)", // Purple border on hover
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
          backgroundColor: "rgba(40, 42, 54, 1)", // Dark menu background
          color: "rgba(248, 248, 242, 1)", // Light text color for menus
          borderRadius: "6px",
          boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(68, 71, 90, 1)", // Subtle border for menus
        },
      },
    },

    MuiListItem: {
      styleOverrides: {
        root: {
          color: "rgba(248, 248, 242, 1)", // Default text color for list items
          "&.Mui-selected": {
            backgroundColor: "rgba(189, 147, 249, 0.3)", // Purple highlight for selected items
            color: "rgba(248, 248, 242, 1)",
          },
          "&:hover": {
            backgroundColor: "transparent", // Transparent background on hover
            textDecoration: "underline", // Underlined text on hover
          },
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            backgroundColor: "rgba(189, 147, 249, 0.3)", // Purple highlight for selected items
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
