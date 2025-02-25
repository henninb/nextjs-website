import React, { useEffect, useState } from "react";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";
import { useRouter } from "next/router";
import useFetchAccount from "../hooks/useAccountFetch";
import Account from "../model/Account";
import FinanceLayout from "../layouts/FinanceLayout";

interface Option {
  value: string;
  label: string;
}

export default function SelectNavigateAccounts() {
  const [options, setOptions] = useState<Option[]>([]);
  const [selectedValue, setSelectedValue] = useState<string>("");
  const [maxWidth, setMaxWidth] = useState<number>(200); // Default width
  const router = useRouter();
  const { data, isSuccess, isError } = useFetchAccount();

  useEffect(() => {
    if (isSuccess && Array.isArray(data)) {
      const optionList = data
        .filter(
          (account: Account) =>
            typeof account.accountNameOwner === "string" &&
            account.accountNameOwner.trim() !== ""
        )
        .map(({ accountNameOwner }: Account) => ({
          value: accountNameOwner,
          label: accountNameOwner,
        }));

      setOptions(optionList);

      // Calculate max width based on longest label
      const longestLabel = optionList.reduce(
        (max, option) =>
          option.label.length > max.length ? option.label : max,
        ""
      );
      const newMaxWidth = Math.max(longestLabel.length * 10, 200); // Ensure minimum width
      setMaxWidth(newMaxWidth);
    }
  }, [isSuccess, data]);

  const handleChange = (event: any) => {
    const selected = event.target.value as string;
    setSelectedValue(selected);
    router.push(`/finance/transactions/${selected}`);
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

  return (
    <div>
      <FinanceLayout>
    <FormControl 
      variant="outlined" 
      sx={{
        minWidth: `${maxWidth}px`,
      }}
    >
      <InputLabel>Select an account</InputLabel>
      <Select
        value={selectedValue}
        onChange={handleChange}
        label="Select an account"
      >
        {options.map((option) => (
          <MenuItem 
            key={option.value} 
            value={option.value} 
          >
            {option.label}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
    </FinanceLayout>
    </div>
  );
}