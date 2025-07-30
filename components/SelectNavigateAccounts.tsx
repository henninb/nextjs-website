import React, { useEffect, useState } from "react";
import {
  Autocomplete,
  TextField,
  FormControl,
  Box,
  Link,
  Typography,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from "@mui/material";
import { Close as CloseIcon } from "@mui/icons-material";
import { useRouter } from "next/router";
import useFetchAccount from "../hooks/useAccountFetch";
import useAccountUsageTracking from "../hooks/useAccountUsageTracking";
import Account from "../model/Account";
import FinanceLayout from "../layouts/FinanceLayout";

interface Option {
  value: string;
  label: string;
}

interface SelectNavigateAccountsProps {
  onNavigate: () => void; // Accept function to close menu
}

export default function SelectNavigateAccounts({
  onNavigate,
}: SelectNavigateAccountsProps) {
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [maxWidth, setMaxWidth] = useState<number>(200);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [accountToRemove, setAccountToRemove] = useState<string | null>(null);
  const router = useRouter();
  const { data, isSuccess, isError } = useFetchAccount();
  const { trackAccountVisit, removeAccount, getMostUsedAccounts } =
    useAccountUsageTracking();

  useEffect(() => {
    if (isSuccess && Array.isArray(data)) {
      const optionList = data
        .filter(
          (account: Account) =>
            typeof account.accountNameOwner === "string" &&
            account.accountNameOwner.trim() !== "",
        )
        .map(({ accountNameOwner }: Account) => ({
          value: accountNameOwner,
          label: accountNameOwner,
        }));
      setOptions(optionList);

      const longestLabel = optionList.reduce(
        (max, option) =>
          option.label.length > max.length ? option.label : max,
        "",
      );
      const newMaxWidth = Math.max(longestLabel.length * 10, 200);
      setMaxWidth(newMaxWidth);
    }
  }, [isSuccess, data]);

  const handleChange = (event: any, newValue: Option | null) => {
    setSelectedOption(newValue);
    if (newValue) {
      trackAccountVisit(newValue.value);
      onNavigate(); // Close menu before navigating
      router.push(`/finance/transactions/${newValue.value}`);
    }
  };

  const handleQuickLinkClick = (accountNameOwner: string) => {
    trackAccountVisit(accountNameOwner);
    onNavigate(); // Close menu before navigating
    router.push(`/finance/transactions/${accountNameOwner}`);
  };

  const handleRemoveAccount = (
    accountNameOwner: string,
    event: React.MouseEvent,
  ) => {
    event.stopPropagation(); // Prevent chip click from navigating
    setAccountToRemove(accountNameOwner);
    setConfirmDialogOpen(true);
  };

  const confirmRemoveAccount = () => {
    if (accountToRemove) {
      removeAccount(accountToRemove);
      setAccountToRemove(null);
    }
    setConfirmDialogOpen(false);
  };

  const cancelRemoveAccount = () => {
    setAccountToRemove(null);
    setConfirmDialogOpen(false);
  };

  if (isError) {
    return (
      <div className="error-message">
        <p>Error fetching accounts. Please try again.</p>
      </div>
    );
  }

  if (!isSuccess || options.length === 0) {
    return <div>Loading accounts or no accounts available...</div>;
  }

  const mostUsedAccounts = getMostUsedAccounts(data || [], 4);

  return (
    <FinanceLayout>
      <Box sx={{ width: "100%" }}>
        <FormControl variant="outlined" sx={{ minWidth: `${maxWidth}px` }}>
          <Autocomplete
            options={options}
            getOptionLabel={(option: Option) => option.label || ""}
            isOptionEqualToValue={(option: Option, value: Option) =>
              option.value === value.value
            }
            value={selectedOption}
            onChange={handleChange}
            slotProps={{
              listbox: {
                style: { whiteSpace: "nowrap" },
              },
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select an account"
                placeholder="Type to search accounts"
                variant="outlined"
              />
            )}
          />
        </FormControl>

        {mostUsedAccounts.length > 0 && (
          <Box sx={{ mt: 2, width: "100%" }}>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 1,
                color: "text.secondary",
                fontSize: "0.75rem",
              }}
            >
              Most Used:
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 0.5,
                maxHeight: "120px",
                overflowY: "auto",
              }}
            >
              {mostUsedAccounts.map((account) => (
                <Box
                  key={account.accountNameOwner}
                  sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                >
                  <Chip
                    label={account.accountNameOwner}
                    variant="outlined"
                    size="small"
                    clickable
                    onClick={() =>
                      handleQuickLinkClick(account.accountNameOwner)
                    }
                    sx={{
                      fontSize: "0.75rem",
                      height: "24px",
                      justifyContent: "flex-start",
                      flex: 1,
                      "& .MuiChip-label": {
                        paddingLeft: "8px",
                        paddingRight: "8px",
                      },
                      "&:hover": {
                        backgroundColor: "action.hover",
                      },
                    }}
                  />
                  <IconButton
                    size="small"
                    onClick={(e) =>
                      handleRemoveAccount(account.accountNameOwner, e)
                    }
                    sx={{
                      width: "20px",
                      height: "20px",
                      padding: "2px",
                      "&:hover": {
                        backgroundColor: "error.light",
                        color: "error.contrastText",
                      },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: "12px" }} />
                  </IconButton>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Box>

      <Dialog
        open={confirmDialogOpen}
        onClose={cancelRemoveAccount}
        maxWidth="sm"
      >
        <DialogTitle>Remove Account</DialogTitle>
        <DialogContent>
          Are you sure you want to remove "{accountToRemove}" from your most
          used accounts? This will clear its usage history.
        </DialogContent>
        <DialogActions>
          <Button onClick={cancelRemoveAccount} color="primary">
            Cancel
          </Button>
          <Button
            onClick={confirmRemoveAccount}
            color="error"
            variant="contained"
          >
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </FinanceLayout>
  );
}
