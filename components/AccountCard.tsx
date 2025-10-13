import React, { useState } from "react";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  useTheme,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import CreditCardIcon from "@mui/icons-material/CreditCard";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useRouter } from "next/router";
import Account from "../model/Account";

type AccountCardProps = {
  account: Account;
  onEdit?: (account: Account) => void;
  onDelete?: (account: Account) => void;
};

export default function AccountCard({
  account,
  onEdit,
  onDelete,
}: AccountCardProps) {
  const theme = useTheme();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = (event?: React.MouseEvent) => {
    event?.stopPropagation();
    setAnchorEl(null);
  };

  const handleEdit = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onEdit?.(account);
  };

  const handleDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    handleMenuClose();
    onDelete?.(account);
  };

  const handleCardClick = () => {
    router.push(`/finance/transactions/${account.accountNameOwner}`);
  };

  const isDebit = account.accountType.toLowerCase() === "debit";
  const isActive = account.activeStatus;

  const formatCurrency = (value: number) =>
    value?.toLocaleString("en-US", {
      style: "currency",
      currency: "USD",
    }) || "$0.00";

  const formatDate = (date: Date) => {
    try {
      return new Date(date).toLocaleDateString("en-US");
    } catch {
      return "N/A";
    }
  };

  return (
    <Card
      sx={{
        height: "100%",
        transition: "all 0.3s ease-in-out",
        cursor: "pointer",
        position: "relative",
        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow:
            "0 12px 24px -4px rgba(0, 0, 0, 0.4), 0 8px 16px -4px rgba(0, 0, 0, 0.3)",
        },
        border: `1px solid ${theme.palette.divider}`,
      }}
      onClick={handleCardClick}
    >
      <CardContent
        sx={{ p: 3, height: "100%", display: "flex", flexDirection: "column" }}
      >
        {/* Header: Type Icon + Actions Menu */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: isDebit
                  ? `${theme.palette.primary.main}20`
                  : `${theme.palette.secondary.main}20`,
                color: isDebit
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
              }}
            >
              {isDebit ? (
                <AccountBalanceWalletIcon fontSize="small" />
              ) : (
                <CreditCardIcon fontSize="small" />
              )}
            </Box>
            <Chip
              label={account.accountType}
              size="small"
              sx={{
                textTransform: "capitalize",
                fontWeight: 600,
                backgroundColor: isDebit
                  ? `${theme.palette.primary.main}20`
                  : `${theme.palette.secondary.main}20`,
                color: isDebit
                  ? theme.palette.primary.main
                  : theme.palette.secondary.main,
              }}
            />
          </Box>

          <IconButton
            size="small"
            onClick={handleMenuOpen}
            sx={{
              "&:hover": {
                backgroundColor: `${theme.palette.primary.main}20`,
              },
            }}
          >
            <MoreVertIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Account Name */}
        <Typography
          variant="h6"
          sx={{
            mb: 1,
            fontWeight: 600,
            color: theme.palette.text.primary,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {account.accountNameOwner}
        </Typography>

        {/* Moniker + Status */}
        <Box sx={{ display: "flex", gap: 1, mb: 3, alignItems: "center" }}>
          {account.moniker && (
            <Chip
              label={account.moniker}
              size="small"
              variant="outlined"
              sx={{
                borderRadius: "6px",
                fontWeight: 500,
                fontSize: "0.75rem",
              }}
            />
          )}
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            {isActive ? (
              <>
                <CheckCircleIcon
                  sx={{ fontSize: 16, color: theme.palette.success.main }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.success.main, fontWeight: 600 }}
                >
                  Active
                </Typography>
              </>
            ) : (
              <>
                <CancelIcon
                  sx={{ fontSize: 16, color: theme.palette.error.main }}
                />
                <Typography
                  variant="caption"
                  sx={{ color: theme.palette.error.main, fontWeight: 600 }}
                >
                  Inactive
                </Typography>
              </>
            )}
          </Box>
        </Box>

        {/* Financial Metrics */}
        <Box sx={{ flex: 1, mb: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 2,
            }}
          >
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                Cleared
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.success.main,
                  fontSize: "0.875rem",
                }}
              >
                {formatCurrency(account.cleared || 0)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                Outstanding
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.warning.main,
                  fontSize: "0.875rem",
                }}
              >
                {formatCurrency(account.outstanding || 0)}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: theme.palette.text.secondary,
                  textTransform: "uppercase",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                }}
              >
                Future
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.info?.main || theme.palette.primary.main,
                  fontSize: "0.875rem",
                }}
              >
                {formatCurrency(account.future || 0)}
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Footer: Validation Date */}
        <Box
          sx={{
            pt: 2,
            borderTop: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.7rem",
            }}
          >
            Last validated: {formatDate(account.validationDate)}
          </Typography>
        </Box>
      </CardContent>

      {/* Actions Menu */}
      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => handleMenuClose()}
        onClick={(e) => e.stopPropagation()}
        PaperProps={{
          sx: {
            mt: 1,
            minWidth: 150,
          },
        }}
      >
        <MenuItem onClick={handleEdit}>Edit Account</MenuItem>
        <MenuItem
          onClick={handleDelete}
          sx={{ color: theme.palette.error.main }}
        >
          Delete Account
        </MenuItem>
      </Menu>
    </Card>
  );
}
