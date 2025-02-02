import React, { useEffect, useState } from "react";
import Select, { SingleValue, ActionMeta } from "react-select";
import { useRouter } from "next/router";
import useFetchAccount from "../hooks/useAccountFetch";
import Account from "../model/Account";

interface Option {
  value: string;
  label: string;
}

export default function SelectNavigateAccounts() {
  const [options, setOptions] = useState<Option[]>([]);
  const [maxWidth, setMaxWidth] = useState<number>(0); // State to hold the max width
  const router = useRouter(); // Replacing useNavigate
  const { data, isSuccess, isError, error } = useFetchAccount();

  const handleChange = (
    newValue: SingleValue<Option>,
    _actionMeta: ActionMeta<Option>,
  ) => {
    if (newValue) {
      router.push(`/finance/transactions/${newValue.value}`);
    }
  };

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

      // Calculate the max width based on the longest label
      const longestLabel = optionList.reduce(
        (max, option) => (option.label.length > max.length ? option.label : max),
        ""
      );
      const newMaxWidth = longestLabel.length * 10; // Adjust multiplier as necessary to fit text
      setMaxWidth(newMaxWidth);
    }
  }, [isSuccess, data]);

  if (isError) {
    return (
      <div className="error-message">
        <p>Error fetching accounts. Please try again.</p>
        {/* <pre>{JSON.stringify(error, null, 2)}</pre>{" "} */}
        {/* Display error details if available */}
      </div>
    );
  }

  if (!isSuccess || options.length === 0) {
    return <div>Loading accounts or no accounts available...</div>;
  }

  return (
    <div className="select-formatting" data-test-id="account-name-owner-select">
      <Select
        options={options}
        onChange={handleChange}
        placeholder="Select account..."
        theme={(theme) => ({
          ...theme,
          borderRadius: 0,
          colors: {
            ...theme.colors,
            primary25: "#9965f4",
            primary: "#ffffff",
          },
        })}
        aria-label="Select an account"
        styles={{
          control: (provided) => ({
            ...provided,
            minWidth: maxWidth ? `${maxWidth}px` : '200px', // Dynamically set the width
            width: maxWidth ? `${maxWidth}px` : 'auto', // Prevent overflow and set width dynamically
          }),
          singleValue: (provided) => ({
            ...provided,
            whiteSpace: 'nowrap', // Prevent text wrapping for selected option
          }),
          option: (provided) => ({
            ...provided,
            whiteSpace: 'nowrap', // Prevent text wrapping in the dropdown
          }),
        }}
      />
    </div>
  );
}