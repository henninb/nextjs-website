"use client";

import React, { useState, ReactNode } from "react";
import { useAuth } from "./AuthProvider";
import { usePathname } from "next/navigation";
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
  Tooltip,
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
import MedicalServicesIcon from "@mui/icons-material/MedicalServices";
import WatchIcon from "@mui/icons-material/Watch";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VerifiedIcon from "@mui/icons-material/Verified";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

import SelectNavigateAccounts from "./SelectNavigateAccounts";
import SessionExpiryWarning from "./SessionExpiryWarning";
import FinanceLayout from "../layouts/FinanceLayout";
import { useUI } from "../contexts/UIContext";
import { modernTheme } from "../themes/modernTheme";

interface LayoutProps {
  children: ReactNode;
}

const financeLinks = [
  { text: "Home", href: "/finance/", icon: <HomeIcon /> },
  { text: "Trends", href: "/finance/trends", icon: <TrendingUpIcon /> },
  { text: "Transfer", href: "/finance/transfers", icon: <SyncAltIcon /> },
  {
    text: "Transfer NextGen",
    href: "/finance/transfers-next",
    icon: <SyncAltIcon />,
  },
  { text: "Payments", href: "/finance/payments", icon: <PaymentIcon /> },
  {
    text: "Payment NextGen",
    href: "/finance/payments-next",
    icon: <PaymentIcon />,
  },
  {
    text: "PaymentsRequired",
    href: "/finance/paymentrequired",
    icon: <ReceiptIcon />,
  },
  {
    text: "Medical Expenses",
    href: "/finance/medical-expenses",
    icon: <MedicalServicesIcon />,
  },
  {
    text: "Validation Amounts",
    href: "/finance/validation-amounts",
    icon: <VerifiedIcon />,
  },
  { text: "Categories", href: "/finance/categories", icon: <CategoryIcon /> },
  {
    text: "Categories NextGen",
    href: "/finance/categories-next",
    icon: <CategoryIcon />,
  },
  {
    text: "Descriptions",
    href: "/finance/descriptions",
    icon: <DescriptionIcon />,
  },
  {
    text: "Descriptions NextGen",
    href: "/finance/descriptions-next",
    icon: <DescriptionIcon />,
  },
  {
    text: "Configuration",
    href: "/finance/configuration",
    icon: <SettingsIcon />,
  },
  {
    text: "Configuration NextGen",
    href: "/finance/configuration-next",
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
  { text: "Portfolio", href: "/portfolio", icon: <ContactPageIcon /> },
  { text: "NBA", href: "/nba", icon: <SportsBasketballIcon /> },
  { text: "NFL", href: "/nfl", icon: <SportsFootballIcon /> },
  { text: "NHL", href: "/nhl", icon: <SportsHockeyIcon /> },
  { text: "MLB", href: "/mlb", icon: <SportsBaseballIcon /> },
  // { text: "Howto", href: "/howto", icon: <MenuBookIcon /> },
  { text: "Tools", href: "/tools", icon: <BuildIcon /> },
  { text: "Temperature", href: "/temperature", icon: <DeviceThermostatIcon /> },
  { text: "Furnace", href: "/furnace", icon: <LocalFireDepartmentIcon /> },
  { text: "Lead", href: "/lead", icon: <ContactPageIcon /> },
  { text: "Payment", href: "/payment", icon: <PaymentIcon /> },
  { text: "SpotifyAuth", href: "/spotifyauth", icon: <MusicNoteIcon /> },
  { text: "Finance", href: "/finance", icon: <MonetizationOnIcon /> },
  { text: "Blog", href: "/blog", icon: <ArticleIcon /> },
  { text: "Watch", href: "/watch", icon: <WatchIcon /> },
];

export default function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const pathname = usePathname();
  const globalTheme = useTheme();
  const { uiMode } = useUI();

  const {
    isAuthenticated,
    user,
    logout,
    showSessionWarning,
    sessionMinutesRemaining,
    extendSession,
  } = useAuth();

  const isFinancePage =
    pathname?.startsWith("/finance") ||
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/register") ||
    false;
  const isLLMGatewayPage = pathname?.startsWith("/llm-gateway") || false;
  const isHomePage = pathname === "/";
  const isCleanPage =
    isHomePage ||
    pathname === "/tools" ||
    pathname === "/temperature" ||
    pathname?.startsWith("/lead") ||
    pathname === "/payment" ||
    pathname === "/watch";

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

  // Use the appropriate theme based on page
  const theme = isFinancePage ? modernTheme : globalTheme;
  const menuLinks = isFinancePage ? financeLinks : generalLinks;

  const toggleDrawer = (open: boolean) => () => {
    setIsOpen(open);
  };

  const content = (
    <Box
      sx={{
        backgroundColor: isHomePage
          ? "transparent"
          : isFinancePage
            ? theme.palette.background.default
            : "#fff",
        color: isHomePage
          ? "#e6f1ff"
          : isFinancePage
            ? theme.palette.text.primary
            : "#000",
        minHeight: "100vh",
      }}
    >
      <AppBar
        position="static"
        elevation={0}
        sx={{
          backgroundColor: alpha(theme.palette.background.paper, 0.9),
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Toolbar sx={{ px: 3 }}>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
            sx={{
              mr: 2,
              borderRadius: 2,
              p: 1.5,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                transform: "scale(1.05)",
              },
            }}
          >
            <MenuIcon
              sx={{
                color: "#3b82f6",
              }}
            />
          </IconButton>

          {isFinancePage && (
            <>
              <Tooltip title="Finance Home" arrow>
                <IconButton
                  href="/finance"
                  aria-label="finance home"
                  sx={{
                    borderRadius: 2,
                    p: 1.5,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <HomeIcon
                    sx={{
                      color: theme.palette.primary.main,
                    }}
                  />
                </IconButton>
              </Tooltip>
              <Tooltip title="Import Transactions" arrow>
                <IconButton
                  href="/finance/transactions/import"
                  aria-label="import transactions"
                  sx={{
                    borderRadius: 2,
                    p: 1.5,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      transform: "scale(1.05)",
                    },
                  }}
                >
                  <ImportExportIcon
                    sx={{
                      color: theme.palette.primary.main,
                    }}
                  />
                </IconButton>
              </Tooltip>
            </>
          )}

          <Box sx={{ flexGrow: 1 }} />
          {isAuthenticated ? (
            // Modern authenticated UI
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
            // Authentication options for non-authenticated users
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
            backgroundColor: theme.palette.background.paper,
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow:
              "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
          },
        }}
      >
        <Box
          sx={{
            p: 2,
            height: "100vh",
            overflow: "auto",
            display: "flex",
            flexDirection: "column",
          }}
        >
          {isFinancePage && (
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
          <List sx={{ px: 1, flex: 1 }}>
            {menuLinks.map(({ text, href, icon }) => (
              <ListItem key={href} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  component="a"
                  href={href}
                  onClick={toggleDrawer(false)}
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    transition: "all 0.2s ease-in-out",
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      transform: "translateX(4px)",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: theme.palette.primary.main,
                    }}
                  >
                    {icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      fontSize: "0.875rem",
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
            {isFinancePage && (
              <ListItem disablePadding sx={{ mt: 2 }}>
                <ListItemButton
                  component="div"
                  sx={{
                    borderRadius: 2,
                    px: 2,
                    py: 1.5,
                    backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.primary.main, 0.15),
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 40,
                      color: theme.palette.primary.main,
                    }}
                  >
                    <ListAltIcon />
                  </ListItemIcon>
                  <SelectNavigateAccounts
                    onNavigate={() => setIsOpen(false)}
                    theme={theme}
                  />
                </ListItemButton>
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
      {children}
      {isFinancePage && isAuthenticated && (
        <SessionExpiryWarning
          open={showSessionWarning}
          minutesRemaining={sessionMinutesRemaining}
          onExtend={extendSession}
          onLogout={logout}
        />
      )}
    </Box>
  );

  // LLM Gateway and clean pages skip the AppBar entirely
  if (isLLMGatewayPage || isCleanPage) {
    return <>{children}</>;
  }

  return isFinancePage ? <FinanceLayout>{content}</FinanceLayout> : content;
}
