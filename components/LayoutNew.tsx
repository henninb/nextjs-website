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
import SyncAltIcon from "@mui/icons-material/SyncAlt"; // Transfers
import PaymentIcon from "@mui/icons-material/Payment"; // Payments
import ReceiptIcon from "@mui/icons-material/Receipt"; // PaymentRequired
import CategoryIcon from "@mui/icons-material/Category"; // Categories
import DescriptionIcon from "@mui/icons-material/Description"; // Descriptions
import SettingsIcon from "@mui/icons-material/Settings"; // Configuration
import ImportExportIcon from "@mui/icons-material/ImportExport"; // Import
import SportsBaseballIcon from "@mui/icons-material/SportsBaseball";
import SportsBasketballIcon from "@mui/icons-material/SportsBasketball";
import SportsFootballIcon from "@mui/icons-material/SportsFootball";
import SportsHockeyIcon from "@mui/icons-material/SportsHockey";
import MonetizationOnIcon from "@mui/icons-material/MonetizationOn"; 
import DeviceThermostatIcon from "@mui/icons-material/DeviceThermostat"; // 🌡️ Temperature
import MusicNoteIcon from "@mui/icons-material/MusicNote"; // 🎵 Spotify
import BuildIcon from "@mui/icons-material/Build"; // 🔧 Best for Tools
import MenuBookIcon from "@mui/icons-material/MenuBook"; // 📖 Best for Howto
import ContactPageIcon from "@mui/icons-material/ContactPage";


import SelectNavigateAccounts from "./SelectNavigateAccounts";
import FinanceLayout from "../layouts/FinanceLayout";

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
];

const generalLinks = [
  { text: "Home", href: "/", icon: <HomeIcon /> },
  { text: "NBA", href: "/nba", icon: <SportsBasketballIcon /> },
  { text: "NFL", href: "/nfl", icon: <SportsFootballIcon /> },
  { text: "NHL", href: "/nhl", icon: <SportsHockeyIcon /> },
  { text: "MLB", href: "/mlb", icon: <SportsBaseballIcon /> },
  { text: "Howto", href: "/howto", icon: <MenuBookIcon /> },
  { text: "Tools", href: "/tools", icon: <BuildIcon /> },
  { text: "Temperature", href: "/temperature", icon: <DeviceThermostatIcon /> },
  { text: "Lead", href: "/lead", icon: <ContactPageIcon /> },
  { text: "Payment", href: "/payment", icon: <PaymentIcon /> },
  { text: "SpotifyAuth", href: "/spotifyauth", icon: <MusicNoteIcon /> },
  { text: "Finance", href: "/finance", icon: <MonetizationOnIcon /> },
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
    <Box
      sx={{
        backgroundColor: isFinancePage ? "rgba(30, 31, 41, 1)" : "#fff",
        color: isFinancePage ? "rgba(248, 248, 242, 1)" : "#000",
        minHeight: "100vh",
      }}
    >
      <AppBar position="static">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer(true)}
          >
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
    {menuLinks.map(({ text, href, icon }) => (
      <ListItem key={href} disablePadding>
        <ListItemButton
          component="a"
          href={href}
          onClick={toggleDrawer(false)} // Ensure menu closes on selection
        >
          <ListItemIcon>{icon}</ListItemIcon>
          <ListItemText primary={text} />
        </ListItemButton>
      </ListItem>
    ))}
    {isFinancePage && (
      // <ListItem disablePadding>
      //   <SelectNavigateAccounts onNavigate={() => setIsOpen(false)} /> {/* Pass function to close menu */}
      // </ListItem>

<ListItem disablePadding>
  <ListItemButton
    component="div"
    sx={{
      backgroundColor: "rgba(73, 74, 87, 1)", // Ensure default background matches Dracula theme
      
      "&:hover": {
        backgroundColor: "rgba(73, 74, 87, 1)", // Prevent green flash on hover
      },
    }}
  >
    <SelectNavigateAccounts onNavigate={() => setIsOpen(false)} />
  </ListItemButton>
</ListItem>

    )}
  </List>
</Drawer>
      {children}
    </Box>
  );

  return isFinancePage ? <FinanceLayout>{content}</FinanceLayout> : content;
}
