import React, { useState, useEffect, useRef } from "react";
import { TextField, IconButton, Box, styled } from "@mui/material";
import { AddCircle, RemoveCircle } from "@mui/icons-material";

interface USDAmountInputProps {
  value: number | string;
  onChange: (value: number | string) => void;
  onBlur?: () => void;
  label?: string;
  fullWidth?: boolean;
  margin?: "none" | "dense" | "normal";
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  placeholder?: string;
}

const StyledContainer = styled(Box)(({ theme }) => ({
  position: "relative",
  display: "flex",
  alignItems: "center",
  "& .MUI-currency-symbol": {
    position: "absolute",
    left: "15px",
    color: theme.palette.text.secondary,
    fontWeight: "bold",
    zIndex: 2,
    pointerEvents: "none",
    fontSize: "1.1rem",
  },
  "& .MUI-decimal-placeholder": {
    position: "absolute",
    right: "50px",
    color: theme.palette.action.disabled,
    fontSize: "1.1rem",
    fontWeight: 500,
    pointerEvents: "none",
    zIndex: 1,
    transition: "opacity 0.2s ease",
  },
  "& .MUI-toggle-sign": {
    position: "absolute",
    right: "15px",
    width: "30px",
    height: "30px",
    minWidth: "30px",
    fontSize: "16px",
    fontWeight: "bold",
    borderRadius: "8px",
    zIndex: 2,
    transition: "all 0.2s ease",
    "&:hover": {
      transform: "scale(1.1)",
    },
    "&:active": {
      transform: "scale(0.95)",
    },
  },
}));

const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== "isPositive" && prop !== "isNegative",
})<{ isPositive?: boolean; isNegative?: boolean }>(
  ({ theme, isPositive, isNegative }) => ({
    "& .MuiInputBase-input": {
      paddingLeft: "35px",
      paddingRight: "50px",
      fontSize: "1.1rem",
      fontWeight: 500,
      fontFamily: "monospace",
      textAlign: "right",
      transition: "all 0.3s ease",
    },
    "& .MuiOutlinedInput-root": {
      transition: "all 0.3s ease",
      "&:focus-within": {
        transform: "translateY(-2px)",
        boxShadow: `0 0 0 3px ${theme.palette.primary.main}20`,
      },
      ...(isPositive && {
        "& fieldset": {
          borderColor: theme.palette.success.main,
        },
        "& .MuiInputBase-input": {
          color: theme.palette.success.dark,
        },
      }),
      ...(isNegative && {
        "& fieldset": {
          borderColor: theme.palette.error.main,
        },
        "& .MuiInputBase-input": {
          color: theme.palette.error.dark,
        },
      }),
    },
  }),
);

export default function USDAmountInput({
  value,
  onChange,
  onBlur,
  label = "USD Amount",
  fullWidth = true,
  margin = "normal",
  disabled = false,
  error = false,
  helperText,
  placeholder,
}: USDAmountInputProps) {
  const [displayValue, setDisplayValue] = useState<string>("");
  const [showDecimalPlaceholder, setShowDecimalPlaceholder] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stringValue = String(value || "0");
    setDisplayValue(stringValue);
    setShowDecimalPlaceholder(!stringValue.includes(".") && stringValue !== "");
  }, [value]);

  const toggleSign = () => {
    const currentValue = displayValue.trim();

    if (
      currentValue === "" ||
      currentValue === "0" ||
      currentValue === "0.00"
    ) {
      return;
    }

    let newValue: string;
    if (currentValue.startsWith("-")) {
      newValue = currentValue.substring(1);
    } else if (currentValue.startsWith("+")) {
      newValue = "-" + currentValue.substring(1);
    } else {
      newValue = "-" + currentValue;
    }

    setDisplayValue(newValue);
    onChange(newValue);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // Allow negative sign at the beginning, digits, and optional decimal with up to 2 places
    const regex = /^-?\d*\.?\d{0,2}$/;

    // Prevent multiple decimal points
    const decimalCount = (inputValue.match(/\./g) || []).length;

    // Prevent multiple negative signs or negative sign not at beginning
    const negativeSignCount = (inputValue.match(/-/g) || []).length;
    const hasValidNegativePosition = inputValue.indexOf("-") <= 0;

    if (
      (regex.test(inputValue) || inputValue === "" || inputValue === "-") &&
      decimalCount <= 1 &&
      negativeSignCount <= 1 &&
      hasValidNegativePosition
    ) {
      setDisplayValue(inputValue);
      setShowDecimalPlaceholder(!inputValue.includes(".") && inputValue !== "");
      onChange(inputValue);
    }
  };

  const handleBlur = () => {
    if (
      displayValue &&
      !displayValue.includes(".") &&
      displayValue !== "-" &&
      displayValue !== ""
    ) {
      const numericValue = parseFloat(displayValue);
      if (!isNaN(numericValue)) {
        const formattedValue = numericValue.toFixed(2);
        setDisplayValue(formattedValue);
        onChange(formattedValue);
        setShowDecimalPlaceholder(false);
      }
    }
    if (onBlur) {
      onBlur();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    const invalidChars = ["e", "E", "+"];
    if (invalidChars.includes(event.key)) {
      event.preventDefault();
    }
  };

  const numericValue = parseFloat(displayValue || "0");
  const isPositive = !isNaN(numericValue) && numericValue > 0;
  const isNegative = !isNaN(numericValue) && numericValue < 0;

  return (
    <StyledContainer>
      <span className="MUI-currency-symbol">$</span>

      <StyledTextField
        inputRef={inputRef}
        label={label}
        fullWidth={fullWidth}
        margin={margin}
        value={displayValue}
        onChange={handleInputChange}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        error={error}
        helperText={helperText}
        placeholder={placeholder}
        isPositive={isPositive}
        isNegative={isNegative}
        inputProps={{
          inputMode: "decimal",
          autoComplete: "off",
        }}
      />

      {showDecimalPlaceholder &&
        displayValue !== "" &&
        displayValue !== "-" && (
          <span className="MUI-decimal-placeholder">.00</span>
        )}

      <IconButton
        className="MUI-toggle-sign"
        onClick={toggleSign}
        disabled={disabled}
        size="small"
        color="primary"
        type="button"
        title="Toggle positive/negative"
      >
        {isNegative ? (
          <AddCircle fontSize="small" />
        ) : (
          <RemoveCircle fontSize="small" />
        )}
      </IconButton>
    </StyledContainer>
  );
}
