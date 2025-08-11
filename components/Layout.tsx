import React, { useState, ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { useRouter } from "next/router";
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Button,
  Avatar,
  Chip,
  useTheme,
  alpha,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import HomeIcon from "@mui/icons-material/Home";
import SyncAltIcon from "@mui/icons-material/SyncAlt";
import PaymentIcon from "@mui/icons-material/Payment";
import ReceiptIcon from "@mui/icons-material/Receipt";
import CategoryIcon from "@mui/icons-material/Category";
import DescriptionIcon from "@mui/icons-material/Description";
import SettingsIcon from "@mui/icons-material/Settings";
import ImportExportIcon from "@mui/icons-material/ImportExport";
import SportsBaseballIcon from "@mui/icons-material/SportsBaseball";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import SportsHockeyIcon from "@mui/icons-material/SportsHockey";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn";
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import BuildIcon from "@mui/icons-material/Build";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import ListAltIcon from "@mui/icons-material/ListAlt";
import ArticleIcon from "@mui/icons-material/Article";
import RestoreIcon from "@mui/icons-material/Restore";

import SelectNavigateAccounts from "./SelectNavigateAccounts";
import FinanceLayout from "../layouts/FinanceLayout";
import { useUI } from "../contexts/UIContext";
import { UIToggleInline } from "./UIToggle";
import { modernTheme } from "../themes/modernTheme";
import { draculaTheme } from "../themes/draculaTheme";

interface LayoutProps {
  children: ReactNode;
}

const financeLinks = [
  { text: "Home", href: "/finance/", icon: <HomeIcon /> },
  { text: "Transfer", href: "/finance/transfers", icon: <SyncAltIcon /> },
  { text: "Payments", href: "/finance/payments", icon: <PaymentIcon /> },
  {
    text: "PaymentsRequired",
    href: "/finance/paymentrequired",
    icon: <ReceiptIcon />,
  },
  { text: "Categories", href: "/finance/categories", icon: <CategoryIcon /> },
  {
    text: "Descriptions",
    href: "/finance/descriptions",
    icon: <DescriptionIcon />,
  },
  {
    text: "Configuration",
    href: "/finance/configuration",
    icon: <SettingsIcon />,
  },
  {
    text: "Import",
    href: "/finance/transactions/import",
    icon: <ImportExportIcon />,
  },
  {
    text: "Backup/Restore",
    href: "/finance/backup",
    icon: <RestoreIcon />,
  },
];

const generalLinks = [
  { text: "Home", href: "/", icon: <HomeIcon /> },
  { text: "NBA", href: "/nba", icon: <SportsBasketballIcon /> },
  { text: "NFL", href: "/nfl", icon: <SportsFootballIcon /> },
  { text: "NHL", href: "/nhl", icon: <SportsHockeyIcon /> },
  { text: "MLB", href: "/mlb", icon: <SportsBaseballIcon /> },
  // { text: "Howto", href: "/howto", icon: <MenuBookIcon /> },
  { text: "Tools", href: "/tools", icon: <BuildIcon /> },
  { text: "Temperature", href: "/temperature", icon: <DeviceThermostatIcon /> },
  { text: "Lead", href: "/lead", icon: <ContactPageIcon /> },
  { text: "Payment", href: "/payment", icon: <PaymentIcon /> },
  { text: "SpotifyAuth", href: "/spotifyauth", icon: <MusicNoteIcon /> },
  { text: "Finance", href: "/finance", icon: <MonetizationOnIcon /> },
  { text: "Blog", href: "/blog", icon: <ArticleIcon /> },
];

export default function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const { pathname } = router;
  const globalTheme = useTheme();
  const { uiMode } = useUI();

  const { isAuthenticated, user, logout } = useAuth();
  const isModern = uiMode === "modern";

  const isFinancePage = pathname.startsWith("/finance");

  // Helper function to safely get user display name with security best practices
  const getUserDisplayName = (): string => {
    try {
      if (!user) {
        return "User";
      }

      // Sanitize and validate user data before display
      const firstName = user.firstName?.trim() || "";
      const lastName = user.lastName?.trim() || "";

      // Only use alphanumeric characters and common name characters for security
      const sanitizeInput = (input: string): string => {
        return input.replace(/[^a-zA-Z0-9\s\-'.]/g, "").substring(0, 20);
      };

      const sanitizedFirstName = sanitizeInput(firstName);
      const sanitizedLastName = sanitizeInput(lastName);

      // Return appropriate display name based on available data
      if (sanitizedFirstName && sanitizedLastName) {
        return `${sanitizedFirstName} ${sanitizedLastName}`;
      } else if (sanitizedFirstName) {
        return sanitizedFirstName;
      } else if (sanitizedLastName) {
        return sanitizedLastName;
      } else if (user.username) {
        // Fall back to sanitized username if no first/last name
        const sanitizedUsername = sanitizeInput(user.username);
        return sanitizedUsername || "User";
      }

      return "User";
    } catch (error) {
      console.error("Error getting user display name:", error);
      return "User";
    }
  };

  // Use the appropriate theme based on page and mode
  const theme =
    isFinancePage && isModern
      ? modernTheme
      : isFinancePage
        ? draculaTheme
        : globalTheme;
  const menuLinks = isFinancePage ? financeLinks : generalLinks;

  const toggleDrawer = (open: boolean) => () => {
    setIsOpen(open);
  };

  const content = (
    <Box
      sx={{
        backgroundColor: isFinancePage
          ? isModern
            ? theme.palette.background.default
            : "rgba(30, 31, 41, 1)"
          : "#fff",
        color: isFinancePage
          ? isModern
            ? theme.palette.text.primary
            : "rgba(248, 248, 242, 1)"
          : "#000",
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="static"
        elevation={isModern ? 0 : 4}
        sx={{
          backgroundColor: isModern
            ? alpha(theme.palette.background.paper, 0.9)
            : undefined,
          backdropFilter: isModern ? "blur(10px)" : undefined,
          borderBottom: isModern
            ? `1px solid ${theme.palette.divider}`
            : undefined,
        }}
      >
        <Toolbar sx={{ px: isModern ? 3 : undefined }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{
              mr: isModern ? 2 : 0,
              borderRadius: isModern ? 2 : undefined,
              p: isModern ? 1.5 : undefined,
              transition: "all 0.2s ease-in-out",
              "&:hover": isModern
                ? {
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    transform: "scale(1.05)",
                  }
                : undefined,
            }}
          >
            <MenuIcon
              sx={{
                color: isModern ? "#3b82f6" : "inherit",
              }}
            />
          </IconButton>

          {isFinancePage && <UIToggleInline />}

          <Box sx={{ flexGrow: 1 }} />
          {isAuthenticated ? (
            // Modern authenticated UI
            isModern ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Chip
                  avatar={
                    <Avatar sx={{ width: 24, height: 24 }}>
                      {getUserDisplayName().charAt(0).toUpperCase()}
                    </Avatar>
                  }
                  label={getUserDisplayName()}
                  variant="outlined"
                  size="small"
                  sx={{
                    borderColor: theme.palette.primary.main,
                    color: theme.palette.primary.main,
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<ExitToAppIcon />}
                  onClick={logout}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    fontWeight: 500,
                  }}
                >
                  Logout
                </Button>
              </Box>
            ) : (
              // Original authenticated UI
              <IconButton color="inherit" onClick={logout}>
                <ExitToAppIcon />
              </IconButton>
            )
          ) : // Authentication options for non-authenticated users
          isModern ? (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<AccountCircleIcon />}
                href="/login"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                }}
              >
                Login
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<HowToRegIcon />}
                href="/register"
                sx={{
                  borderRadius: 2,
                  textTransform: "none",
                  fontWeight: 500,
                  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
                }}
              >
                Register
              </Button>
            </Box>
          ) : (
            // Original non-authenticated UI
            <>
              <IconButton color="inherit" href="/login">
                <AccountCircleIcon />
              </IconButton>
              <IconButton color="inherit" href="/register">
                <HowToRegIcon />
              </IconButton>
            </>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        anchor="left"
        open={isOpen}
        onClose={toggleDrawer(false)}
        PaperProps={{
          sx: {
            width: 320,
            height: "100vh",
            maxHeight: "100vh",
            overflow: "hidden",
            backgroundColor: isModern
              ? theme.palette.background.paper
              : undefined,
            borderRight: isModern
              ? `1px solid ${theme.palette.divider}`
              : undefined,
            boxShadow: isModern
              ? "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)"
              : undefined,
          },
        }}
      >
        <Box
          sx={{
            p: isModern ? 2 : 0,
            height: isModern ? "100vh" : "auto",
            overflow: isModern ? "auto" : "visible",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isModern && isFinancePage && (
            <Box sx={{ mb: 3, textAlign: "center", flexShrink: 0 }}>
              <Chip
                label="Finance Dashboard"
                variant="outlined"
                sx={{
                  borderColor: theme.palette.primary.main,
                  color: theme.palette.primary.main,
                  fontWeight: 600,
                  fontSize: "0.75rem",
                }}
              />
            </Box>
          )}
          <List sx={{ px: isModern ? 1 : 0, flex: 1 }}>
            {menuLinks.map(({ text, href, icon }) => (
              <ListItem
                key={href}
                disablePadding
                sx={{ mb: isModern ? 0.5 : 0 }}
              >
                <ListItemButton
                  component="a"
                  href={href}
                  onClick={toggleDrawer(false)}
                  sx={{
                    borderRadius: isModern ? 2 : 0,
                    px: isModern ? 2 : 2,
                    py: isModern ? 1.5 : 1,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": isModern
                      ? {
                          backgroundColor: alpha(
                            theme.palette.primary.main,
                            0.1,
                          ),
                          transform: "translateX(4px)",
                        }
                      : {
                          backgroundColor: "rgba(73, 74, 87, 1)",
                        },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isModern ? 40 : 56,
                      color: isModern
                        ? theme.palette.primary.main
                        : "rgba(139, 233, 253, 1)",
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    primaryTypographyProps={{
                      fontWeight: isModern ? 500 : "normal",
                      fontSize: isModern ? "0.875rem" : undefined,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {isFinancePage && (
              <ListItem disablePadding sx={{ mt: isModern ? 2 : 0 }}>
                <ListItemButton
                  component="div"
                  sx={{
                    borderRadius: isModern ? 2 : 0,
                    px: isModern ? 2 : 2,
                    py: isModern ? 1.5 : 1,
                    backgroundColor: isModern
                      ? alpha(theme.palette.primary.main, 0.1)
                      : alpha("#10b981", 0.1),
                    "&:hover": {
                      backgroundColor: isModern
                        ? alpha(theme.palette.primary.main, 0.15)
                        : alpha("#10b981", 0.15),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isModern ? 40 : 56,
                      color: isModern ? theme.palette.primary.main : "#10b981",
                    }}
                  >
                    <ListAltIcon />
                  </ListItemIcon>
                  <SelectNavigateAccounts
                    onNavigate={() => setIsOpen(false)}
                    isModern={isModern}
                    theme={theme}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      {children}
    </Box>
  );

  return isFinancePage ? <FinanceLayout>{content}</FinanceLayout> : content;
}
