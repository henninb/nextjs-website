import React, { useMemo, useState } from "react";
import {
  Autocomplete,
  TextField,
  FormControl,
  Box,
  Link,
  Typography,
  Chip,
  IconButton,
  Theme,
} from "@mui/material";
import ErrorDisplay from "./ErrorDisplay";
import LoadingState from "./LoadingState";
import { Close as CloseIcon } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import useFetchAccount from "../hooks/useAccountFetch";
import useAccountUsageTracking from "../hooks/useAccountUsageTracking";
import Account from "../model/Account";

interface Option {
  value: string;
  label: string;
}

interface SelectNavigateAccountsProps {
  onNavigate: () => void; // Accept function to close menu
  theme?: Theme;
}

export default function SelectNavigateAccounts({
  onNavigate,
  theme,
}: SelectNavigateAccountsProps) {
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const router = useRouter();
  const { data, isSuccess, isError, error, isLoading, refetch } =
    useFetchAccount();
  const { trackAccountVisit, removeAccount, getMostUsedAccounts } =
    useAccountUsageTracking();

  const options = useMemo<Option[]>(() => {
    if (!isSuccess || !Array.isArray(data)) return [];
    return data
      .filter(
        (account: Account) =>
          typeof account.accountNameOwner === "string" &&
          account.accountNameOwner.trim() !== "",
      )
      .map(({ accountNameOwner }: Account) => ({
        value: accountNameOwner,
        label: accountNameOwner,
      }));
  }, [isSuccess, data]);

  const maxWidth = useMemo<number>(() => {
    if (options.length === 0) return 200;
    const longestLabel = options.reduce(
      (max, option) => (option.label.length > max.length ? option.label : max),
      "",
    );
    return Math.max(longestLabel.length * 10, 200);
  }, [options]);

  const handleChange = (
    _event: React.SyntheticEvent,
    newValue: Option | null,
  ) => {
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
    removeAccount(accountNameOwner);
  };

  if (isError) {
    return (
      <Box sx={{ width: "100%" }}>
        <ErrorDisplay
          error={error}
          variant="inline"
          showRetry={true}
          onRetry={() => refetch()}
        />
      </Box>
    );
  }

  if (isLoading || !isSuccess) {
    return (
      <Box sx={{ width: "100%" }}>
        <LoadingState
          variant="skeleton"
          message="Loading accounts..."
          size="small"
          rows={1}
        />
      </Box>
    );
  }

  if (options.length === 0) {
    return (
      <Box sx={{ width: "100%", p: 2, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          No accounts available
        </Typography>
      </Box>
    );
  }

  const mostUsedAccounts = getMostUsedAccounts(data || [], 4);

  return (
    <Box sx={{ width: "100%" }}>
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
                sx={{
                  "& .MuiOutlinedInput-root": {
                    backgroundColor: "transparent",
                    "& fieldset": {
                      borderColor: theme?.palette?.divider || "rgba(255, 255, 255, 0.23)",
                    },
                    "&:hover fieldset": {
                      borderColor: theme?.palette?.primary?.main || "#3b82f6",
                    },
                    "&.Mui-focused fieldset": {
                      borderColor: theme?.palette?.primary?.main || "#3b82f6",
                    },
                  },
                  "& .MuiInputLabel-root": {
                    color: theme?.palette?.text?.secondary || "rgba(255, 255, 255, 0.7)",
                  },
                  "& .MuiInputBase-input": {
                    color: theme?.palette?.text?.primary || "#fff",
                  },
                }}
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
                color: theme?.palette?.text?.secondary || "rgba(255, 255, 255, 0.7)",
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
                      backgroundColor: "transparent",
                      borderColor: theme?.palette?.divider || "rgba(255, 255, 255, 0.23)",
                      color: theme?.palette?.text?.primary || "#fff",
                      "& .MuiChip-label": {
                        paddingLeft: "8px",
                        paddingRight: "8px",
                      },
                      "&:hover": {
                        backgroundColor: theme?.palette?.action?.hover || "rgba(255, 255, 255, 0.08)",
                        borderColor: theme?.palette?.primary?.main || "#3b82f6",
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
                      color: theme?.palette?.text?.secondary || "rgba(255, 255, 255, 0.7)",
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
    </Box>
  );
}
