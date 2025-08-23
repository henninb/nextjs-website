// Isolated tests for USDAmountInput business logic
// Testing core validation and formatting functions without React/DOM dependencies

interface USDAmountValidationResult {
  isValid: boolean;
  errors?: string[];
}

// Extract core business logic functions for isolated testing
class USDAmountValidator {
  static validateInput(inputValue: string): USDAmountValidationResult {
    const errors: string[] = [];

    // Allow negative sign at the beginning, digits, and optional decimal with up to 2 places
    const regex = /^-?\d*\.?\d{0,2}$/;

    // Check basic format
    if (!regex.test(inputValue) && inputValue !== "" && inputValue !== "-") {
      errors.push("Invalid format");
    }

    // Prevent multiple decimal points
    const decimalCount = (inputValue.match(/\./g) || []).length;
    if (decimalCount > 1) {
      errors.push("Multiple decimal points not allowed");
    }

    // Prevent multiple negative signs or negative sign not at beginning
    const negativeSignCount = (inputValue.match(/-/g) || []).length;
    const hasValidNegativePosition = inputValue.indexOf("-") <= 0;

    if (negativeSignCount > 1) {
      errors.push("Multiple negative signs not allowed");
    }

    if (!hasValidNegativePosition) {
      errors.push("Negative sign must be at the beginning");
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  static shouldPreventKeyDown(key: string): boolean {
    const invalidChars = ["e", "E", "+"];
    return invalidChars.includes(key);
  }

  static formatOnBlur(displayValue: string): string | null {
    // Only format strict whole numbers (optional leading minus), no other chars
    const wholeNumberRegex = /^-?\d+$/;
    if (wholeNumberRegex.test(displayValue)) {
      const numericValue = parseFloat(displayValue);
      if (!isNaN(numericValue)) {
        return numericValue.toFixed(2);
      }
    }
    return null;
  }

  static toggleSign(currentValue: string): string | null {
    const trimmedValue = currentValue.trim();

    if (
      trimmedValue === "" ||
      trimmedValue === "0" ||
      trimmedValue === "0.00"
    ) {
      return null; // No change for zero or empty values
    }

    let newValue: string;
    if (trimmedValue.startsWith("-")) {
      newValue = trimmedValue.substring(1);
    } else if (trimmedValue.startsWith("+")) {
      newValue = "-" + trimmedValue.substring(1);
    } else {
      newValue = "-" + trimmedValue;
    }

    return newValue;
  }

  static shouldShowDecimalPlaceholder(value: string): boolean {
    return !value.includes(".") && value !== "" && value !== "-";
  }

  static getDisplayValue(value: string | number): string {
    const stringValue =
      value === 0 || value === 0.0 || value === "0" || value === "0.0" || !value
        ? ""
        : String(value);
    return stringValue;
  }

  static parseNumericValue(displayValue: string): {
    isPositive: boolean;
    isNegative: boolean;
    numericValue: number;
  } {
    const numericValue = parseFloat(displayValue || "0");
    const isPositive = !isNaN(numericValue) && numericValue > 0;
    const isNegative = !isNaN(numericValue) && numericValue < 0;

    return { isPositive, isNegative, numericValue };
  }
}

describe("USDAmountValidator (Isolated)", () => {
  describe("Input Validation", () => {
    it("should validate correct decimal numbers", () => {
      const validInputs = [
        "123",
        "123.45",
        "-123.45",
        "0.99",
        "-0.99",
        "",
        "-",
        "0",
        "1000000.00",
      ];

      validInputs.forEach((input) => {
        const result = USDAmountValidator.validateInput(input);
        expect(result.isValid).toBe(true);
        expect(result.errors).toBeUndefined();
      });
    });

    it("should invalidate incorrect formats", () => {
      const invalidInputs = [
        "123.456", // Too many decimal places
        "12.34.56", // Multiple decimal points
        "--123", // Multiple negative signs
        "12-3", // Negative sign in wrong position
        "abc", // Non-numeric characters
        "123e2", // Scientific notation
        "123+", // Plus sign
        "12.3.4.5", // Multiple decimal points
      ];

      invalidInputs.forEach((input) => {
        const result = USDAmountValidator.validateInput(input);
        expect(result.isValid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors!.length).toBeGreaterThan(0);
      });
    });

    it("should detect multiple decimal points", () => {
      const result = USDAmountValidator.validateInput("123.45.67");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Multiple decimal points not allowed");
    });

    it("should detect multiple negative signs", () => {
      const result = USDAmountValidator.validateInput("--123");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Multiple negative signs not allowed");
    });

    it("should detect negative sign in wrong position", () => {
      const result = USDAmountValidator.validateInput("12-3");

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("Negative sign must be at the beginning");
    });
  });

  describe("Key Prevention", () => {
    it("should prevent invalid characters", () => {
      const invalidKeys = ["e", "E", "+"];

      invalidKeys.forEach((key) => {
        expect(USDAmountValidator.shouldPreventKeyDown(key)).toBe(true);
      });
    });

    it("should allow valid characters", () => {
      const validKeys = [
        "0",
        "1",
        "2",
        "3",
        "4",
        "5",
        "6",
        "7",
        "8",
        "9",
        ".",
        "-",
        "Backspace",
        "Delete",
        "Tab",
      ];

      validKeys.forEach((key) => {
        expect(USDAmountValidator.shouldPreventKeyDown(key)).toBe(false);
      });
    });
  });

  describe("Blur Formatting", () => {
    it("should format whole numbers to two decimal places", () => {
      expect(USDAmountValidator.formatOnBlur("123")).toBe("123.00");
      expect(USDAmountValidator.formatOnBlur("0")).toBe("0.00");
      expect(USDAmountValidator.formatOnBlur("1")).toBe("1.00");
      expect(USDAmountValidator.formatOnBlur("1000")).toBe("1000.00");
    });

    it("should not format numbers that already have decimals", () => {
      expect(USDAmountValidator.formatOnBlur("123.45")).toBeNull();
      expect(USDAmountValidator.formatOnBlur("123.5")).toBeNull();
      expect(USDAmountValidator.formatOnBlur("0.99")).toBeNull();
    });

    it("should not format lone negative sign", () => {
      expect(USDAmountValidator.formatOnBlur("-")).toBeNull();
    });

    it("should not format empty strings", () => {
      expect(USDAmountValidator.formatOnBlur("")).toBeNull();
    });

    it("should handle negative whole numbers", () => {
      expect(USDAmountValidator.formatOnBlur("-123")).toBe("-123.00");
      expect(USDAmountValidator.formatOnBlur("-0")).toBe("0.00");
    });

    it("should handle invalid numbers", () => {
      expect(USDAmountValidator.formatOnBlur("abc")).toBeNull();
      expect(USDAmountValidator.formatOnBlur("12a3")).toBeNull();
    });
  });

  describe("Sign Toggle", () => {
    it("should toggle positive to negative", () => {
      expect(USDAmountValidator.toggleSign("123.45")).toBe("-123.45");
      expect(USDAmountValidator.toggleSign("123")).toBe("-123");
      expect(USDAmountValidator.toggleSign("0.01")).toBe("-0.01");
    });

    it("should toggle negative to positive", () => {
      expect(USDAmountValidator.toggleSign("-123.45")).toBe("123.45");
      expect(USDAmountValidator.toggleSign("-123")).toBe("123");
      expect(USDAmountValidator.toggleSign("-0.01")).toBe("0.01");
    });

    it("should handle numbers with plus sign", () => {
      expect(USDAmountValidator.toggleSign("+123")).toBe("-123");
      expect(USDAmountValidator.toggleSign("+123.45")).toBe("-123.45");
    });

    it("should not toggle zero values", () => {
      expect(USDAmountValidator.toggleSign("0")).toBeNull();
      expect(USDAmountValidator.toggleSign("0.00")).toBeNull();
      expect(USDAmountValidator.toggleSign("")).toBeNull();
    });

    it("should handle whitespace", () => {
      expect(USDAmountValidator.toggleSign("  123.45  ")).toBe("-123.45");
      expect(USDAmountValidator.toggleSign("  -123.45  ")).toBe("123.45");
      expect(USDAmountValidator.toggleSign("   ")).toBeNull();
    });
  });

  describe("Decimal Placeholder Logic", () => {
    it("should show decimal placeholder for whole numbers", () => {
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("123")).toBe(true);
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("1")).toBe(true);
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("0")).toBe(true);
    });

    it("should not show decimal placeholder for decimals", () => {
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("123.45")).toBe(
        false,
      );
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("123.")).toBe(
        false,
      );
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("0.5")).toBe(
        false,
      );
    });

    it("should not show decimal placeholder for empty or lone negative", () => {
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("")).toBe(false);
      expect(USDAmountValidator.shouldShowDecimalPlaceholder("-")).toBe(false);
    });
  });

  describe("Display Value Conversion", () => {
    it("should convert various input types to display strings", () => {
      expect(USDAmountValidator.getDisplayValue("123.45")).toBe("123.45");
      expect(USDAmountValidator.getDisplayValue(123.45)).toBe("123.45");
      expect(USDAmountValidator.getDisplayValue("")).toBe("");
      expect(USDAmountValidator.getDisplayValue(null)).toBe("");
      expect(USDAmountValidator.getDisplayValue(undefined)).toBe("");
    });

    it("should handle zero values correctly", () => {
      expect(USDAmountValidator.getDisplayValue(0)).toBe("");
      expect(USDAmountValidator.getDisplayValue(0.0)).toBe("");
      expect(USDAmountValidator.getDisplayValue("0")).toBe("");
      expect(USDAmountValidator.getDisplayValue("0.0")).toBe("");
    });

    it("should handle negative values", () => {
      expect(USDAmountValidator.getDisplayValue(-123.45)).toBe("-123.45");
      expect(USDAmountValidator.getDisplayValue("-123.45")).toBe("-123.45");
    });
  });

  describe("Numeric Value Parsing", () => {
    it("should correctly identify positive values", () => {
      const result = USDAmountValidator.parseNumericValue("123.45");

      expect(result.isPositive).toBe(true);
      expect(result.isNegative).toBe(false);
      expect(result.numericValue).toBe(123.45);
    });

    it("should correctly identify negative values", () => {
      const result = USDAmountValidator.parseNumericValue("-123.45");

      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(true);
      expect(result.numericValue).toBe(-123.45);
    });

    it("should handle zero values", () => {
      const result = USDAmountValidator.parseNumericValue("0");

      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(false);
      expect(result.numericValue).toBe(0);
    });

    it("should handle empty values", () => {
      const result = USDAmountValidator.parseNumericValue("");

      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(false);
      expect(result.numericValue).toBe(0);
    });

    it("should handle invalid values", () => {
      const result = USDAmountValidator.parseNumericValue("abc");

      expect(result.isPositive).toBe(false);
      expect(result.isNegative).toBe(false);
      expect(result.numericValue).toBeNaN();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large numbers", () => {
      const largeNumber = "999999999.99";
      const validation = USDAmountValidator.validateInput(largeNumber);
      const parsing = USDAmountValidator.parseNumericValue(largeNumber);

      expect(validation.isValid).toBe(true);
      expect(parsing.isPositive).toBe(true);
      expect(parsing.numericValue).toBe(999999999.99);
    });

    it("should handle very small numbers", () => {
      const smallNumber = "0.01";
      const validation = USDAmountValidator.validateInput(smallNumber);
      const parsing = USDAmountValidator.parseNumericValue(smallNumber);

      expect(validation.isValid).toBe(true);
      expect(parsing.isPositive).toBe(true);
      expect(parsing.numericValue).toBe(0.01);
    });

    it("should handle precision edge cases", () => {
      expect(USDAmountValidator.validateInput("123.99")).toEqual({
        isValid: true,
      });
      expect(USDAmountValidator.validateInput("123.999")).toEqual({
        isValid: false,
        errors: expect.arrayContaining(["Invalid format"]),
      });
    });

    it("should handle decimal-only input", () => {
      expect(USDAmountValidator.validateInput(".")).toEqual({ isValid: true });
      expect(USDAmountValidator.validateInput(".5")).toEqual({ isValid: true });
      expect(USDAmountValidator.validateInput("-.5")).toEqual({
        isValid: true,
      });
    });
  });
});
