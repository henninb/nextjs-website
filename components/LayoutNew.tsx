import { useState, ReactNode } from "react";
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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import HomeIcon from "@mui/icons-material/Home";
import SelectNavigateAccounts from "./SelectNavigateAccounts";
import FinanceLayout from "../layouts/FinanceLayout";

interface LayoutProps {
  children: ReactNode;
}

const financeLinks = [
  { text: "Home", href: "/finance/" },
  { text: "Transfer", href: "/finance/transfers" },
  { text: "Payments", href: "/finance/payments" },
  { text: "PaymentsRequired", href: "/finance/paymentrequired" },
  { text: "Categories", href: "/finance/categories" },
  { text: "Descriptions", href: "/finance/descriptions" },
  { text: "Configuration", href: "/finance/configuration" },
];

const generalLinks = [
  { text: "Home", href: "/" },
  { text: "NBA", href: "/nba" },
  { text: "NHL", href: "/nhl" },
  { text: "MLB", href: "/mlb" },
  { text: "Howto", href: "/howto" },
  { text: "Tools", href: "/tools" },
  { text: "Temperature", href: "/temperature" },
  { text: "Lead", href: "/lead" },
  { text: "Payment", href: "/payment" },
  { text: "SpotifyAuth", href: "/spotifyauth" },
  { text: "Finance", href: "/finance" },
];

export default function Layout({ children }: LayoutProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const router = useRouter();
  const { pathname } = router;

  const isFinancePage = pathname.startsWith("/finance");
  const menuLinks = isFinancePage ? financeLinks : generalLinks;

  const toggleDrawer = (open: boolean) => () => {
    setIsOpen(open);
  };

  const content = (
    // <Box sx={{ backgroundColor: isFinancePage ? "inherit" : "#fff", minHeight: "100vh" }}>
         <Box sx={{ backgroundColor: isFinancePage ? "#f5f5f5" : "#fff", minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton edge="start" color="inherit" aria-label="menu" onClick={toggleDrawer(true)}>
            <MenuIcon />
          </IconButton>
          <IconButton color="inherit" href="/login">
            <AccountCircleIcon />
          </IconButton>
          <IconButton color="inherit" href="/logout">
            <ExitToAppIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer anchor="left" open={isOpen} onClose={toggleDrawer(false)}>
        <List>
          {menuLinks.map(({ text, href }) => (
            <ListItem key={href} disablePadding>
              <ListItemButton component="a" href={href}>
                <ListItemIcon>
                  <HomeIcon />
                </ListItemIcon>
                <ListItemText primary={text} />
              </ListItemButton>
            </ListItem>
          ))}
          {isFinancePage && (
            <ListItem disablePadding>
              <SelectNavigateAccounts />
            </ListItem>
          )}
        </List>
      </Drawer>
      {children}
    </Box>
  );

  return isFinancePage ? <FinanceLayout>{content}</FinanceLayout> : content;
}