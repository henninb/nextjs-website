import { createTheme } from "@mui/material/styles";

export const blogTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#6366f1", // Modern indigo
      light: "#8b5cf6", // Soft purple
      dark: "#4f46e5",
    },
    secondary: {
      main: "#f59e0b", // Warm amber for accents
      light: "#fbbf24",
      dark: "#d97706",
    },
    background: {
      default: "#0a0d14", // Deep dark blue-black
      paper: "#1a1f2e", // Dark slate blue for content areas
    },
    text: {
      primary: "#f1f5f9", // Very light gray for excellent readability
      secondary: "#94a3b8", // Medium gray for secondary text
    },
    divider: "#334155",
    accent: {
      gradient:
        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
      glow: "rgba(99, 102, 241, 0.3)",
    },
  },
  typography: {
    fontFamily:
      '"Inter", "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontSize: "clamp(2.5rem, 5vw, 4rem)",
      fontWeight: 800,
      lineHeight: 1.1,
      letterSpacing: "-0.02em",
      background:
        "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      backgroundClip: "text",
    },
    h2: {
      fontSize: "clamp(2rem, 4vw, 3rem)",
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: "-0.01em",
      color: "#f1f5f9",
    },
    h3: {
      fontSize: "clamp(1.5rem, 3vw, 2rem)",
      fontWeight: 600,
      lineHeight: 1.3,
      color: "#f1f5f9",
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#e2e8f0",
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 600,
      lineHeight: 1.4,
      color: "#cbd5e1",
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.5,
      color: "#94a3b8",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    body1: {
      fontSize: "1.125rem",
      lineHeight: 1.7,
      color: "#f1f5f9",
      letterSpacing: "0.01em",
    },
    body2: {
      fontSize: "1rem",
      lineHeight: 1.6,
      color: "#cbd5e1",
    },
    subtitle1: {
      fontSize: "1.25rem",
      lineHeight: 1.6,
      color: "#94a3b8",
      fontWeight: 400,
    },
    caption: {
      fontSize: "0.875rem",
      lineHeight: 1.5,
      color: "#64748b",
      fontStyle: "italic",
    },
  },
  shape: {
    borderRadius: 16,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#0a0d14",
          backgroundImage: `
            radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.05) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.03) 0%, transparent 50%)
          `,
          backgroundAttachment: "fixed",
        },
        // Enhanced typography for blog content
        ".blog-content": {
          "& h1, & h2, & h3, & h4, & h5, & h6": {
            marginTop: "2rem",
            marginBottom: "1rem",
            fontWeight: 600,
          },
          "& h1": {
            fontSize: "2.5rem",
            fontWeight: 700,
            marginTop: "3rem",
            marginBottom: "1.5rem",
          },
          "& h2": {
            fontSize: "2rem",
            fontWeight: 700,
            marginTop: "2.5rem",
            borderBottom: "2px solid rgba(99, 102, 241, 0.3)",
            paddingBottom: "0.5rem",
          },
          "& p": {
            fontSize: "1.125rem",
            lineHeight: 1.8,
            marginBottom: "1.5rem",
            color: "#f1f5f9",
          },
          "& code": {
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            color: "#c792ea",
            padding: "0.2rem 0.4rem",
            borderRadius: "4px",
            fontSize: "0.9em",
            fontFamily: '"Fira Code", "JetBrains Mono", Consolas, monospace',
          },
          "& pre": {
            backgroundColor: "#1e1e2e",
            border: "1px solid #313244",
            borderRadius: "12px",
            padding: "1.5rem",
            marginY: "2rem",
            overflow: "auto",
            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.3)",
            "& code": {
              backgroundColor: "transparent",
              padding: 0,
              borderRadius: 0,
            },
          },
          "& blockquote": {
            borderLeft: "4px solid #6366f1",
            paddingLeft: "1.5rem",
            margin: "2rem 0",
            fontStyle: "italic",
            color: "#94a3b8",
            backgroundColor: "rgba(99, 102, 241, 0.05)",
            padding: "1rem 1.5rem",
            borderRadius: "8px",
          },
          "& ul, & ol": {
            paddingLeft: "1.5rem",
            marginBottom: "1.5rem",
            "& li": {
              marginBottom: "0.5rem",
              fontSize: "1.125rem",
              lineHeight: 1.7,
            },
          },
          "& a": {
            color: "#6366f1",
            textDecoration: "none",
            fontWeight: 500,
            borderBottom: "1px solid rgba(99, 102, 241, 0.3)",
            transition: "all 0.2s ease",
            "&:hover": {
              color: "#8b5cf6",
              borderBottomColor: "#8b5cf6",
            },
          },
          "& img": {
            maxWidth: "100%",
            height: "auto",
            borderRadius: "12px",
            margin: "2rem 0",
            boxShadow: "0 8px 30px rgba(0, 0, 0, 0.3)",
          },
        },
      },
    },

    // Modern blog card styling
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(145deg, #1a1f2e 0%, #1e2332 100%)",
          borderRadius: "20px",
          border: "1px solid rgba(99, 102, 241, 0.1)",
          boxShadow:
            "0 8px 32px rgba(0, 0, 0, 0.3), 0 2px 8px rgba(99, 102, 241, 0.1)",
          overflow: "hidden",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            transform: "translateY(-8px)",
            boxShadow:
              "0 16px 48px rgba(0, 0, 0, 0.4), 0 4px 16px rgba(99, 102, 241, 0.2)",
            borderColor: "rgba(99, 102, 241, 0.3)",
          },
        },
      },
    },

    // Enhanced button styles for blog
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          textTransform: "none",
          fontWeight: 600,
          padding: "12px 24px",
          fontSize: "1rem",
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        contained: {
          background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
          color: "#ffffff",
          boxShadow: "0 4px 16px rgba(99, 102, 241, 0.3)",
          "&:hover": {
            background: "linear-gradient(135deg, #5855eb 0%, #7c3aed 100%)",
            boxShadow: "0 8px 32px rgba(99, 102, 241, 0.4)",
            transform: "translateY(-2px)",
          },
        },
        outlined: {
          borderColor: "rgba(99, 102, 241, 0.5)",
          color: "#6366f1",
          "&:hover": {
            borderColor: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
            transform: "translateY(-2px)",
          },
        },
        text: {
          color: "#94a3b8",
          "&:hover": {
            color: "#6366f1",
            backgroundColor: "rgba(99, 102, 241, 0.1)",
          },
        },
      },
    },

    // Modern chip styling for tags
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: "20px",
          fontWeight: 500,
          fontSize: "0.875rem",
          height: "32px",
          transition: "all 0.2s ease",
        },
        filled: {
          background:
            "linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
          color: "#a78bfa",
          border: "1px solid rgba(99, 102, 241, 0.3)",
          "&:hover": {
            background:
              "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(139, 92, 246, 0.25) 100%)",
            transform: "translateY(-1px)",
          },
        },
      },
    },

    // Typography for blog headers
    MuiTypography: {
      styleOverrides: {
        h1: {
          marginBottom: "2rem",
        },
        h2: {
          marginBottom: "1.5rem",
          marginTop: "3rem",
        },
        h3: {
          marginBottom: "1rem",
          marginTop: "2rem",
        },
      },
    },

    // Container with better spacing
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingTop: "2rem",
          paddingBottom: "2rem",
        },
      },
    },

    // Paper with modern styling
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "linear-gradient(145deg, #1a1f2e 0%, #1e2332 100%)",
          borderRadius: "20px",
          border: "1px solid rgba(99, 102, 241, 0.1)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
        },
      },
    },
  },
});
