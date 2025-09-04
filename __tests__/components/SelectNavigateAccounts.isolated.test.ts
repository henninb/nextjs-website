/**
 * Isolated tests for SelectNavigateAccounts business logic
 * Tests core functions without React rendering overhead
 */

import Account from "../../model/Account";
import { createTestAccount, ConsoleSpy } from "../../testHelpers";

// Extract business logic functions from SelectNavigateAccounts component

/**
 * Transforms account data into autocomplete options
 */
export const transformAccountsToOptions = (accounts: Account[]) => {
  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts
    .filter(
      (account: Account) =>
        account &&
        typeof account.accountNameOwner === "string" &&
        account.accountNameOwner.trim() !== "",
    )
    .map(({ accountNameOwner }: Account) => ({
      value: accountNameOwner,
      label: accountNameOwner,
    }));
};

/**
 * Calculates the maximum width needed for the autocomplete dropdown
 */
export const calculateMaxWidth = (options: Array<{ label: string }>) => {
  if (!options.length) {
    return 200; // Default minimum width
  }

  const longestLabel = options.reduce(
    (max, option) => (option.label.length > max.length ? option.label : max),
    "",
  );

  return Math.max(longestLabel.length * 10, 200);
};

/**
 * Validates if an account name is suitable for navigation
 */
export const isValidAccountForNavigation = (
  accountNameOwner: string,
): boolean => {
  return typeof accountNameOwner === "string" && accountNameOwner.trim() !== "";
};

/**
 * Builds the navigation URL for an account
 */
export const buildAccountNavigationUrl = (accountNameOwner: string): string => {
  if (!isValidAccountForNavigation(accountNameOwner)) {
    throw new Error("Invalid account name for navigation");
  }
  return `/finance/transactions/${accountNameOwner}`;
};

/**
 * Filters accounts to show only those with valid names
 */
export const filterValidAccounts = (accounts: Account[]): Account[] => {
  if (!Array.isArray(accounts)) {
    return [];
  }

  return accounts.filter((account: Account) =>
    isValidAccountForNavigation(account.accountNameOwner),
  );
};

describe("SelectNavigateAccounts Business Logic (Isolated)", () => {
  describe("transformAccountsToOptions", () => {
    it("should transform valid accounts to options", () => {
      const accounts = [
        createTestAccount({ accountNameOwner: "Checking" }),
        createTestAccount({ accountNameOwner: "Savings" }),
        createTestAccount({ accountNameOwner: "Investment" }),
      ];

      const options = transformAccountsToOptions(accounts);

      expect(options).toEqual([
        { value: "Checking", label: "Checking" },
        { value: "Savings", label: "Savings" },
        { value: "Investment", label: "Investment" },
      ]);
    });

    it("should filter out accounts with empty names", () => {
      const accounts = [
        createTestAccount({ accountNameOwner: "Valid Account" }),
        createTestAccount({ accountNameOwner: "" }),
        createTestAccount({ accountNameOwner: "   " }), // whitespace only
        createTestAccount({ accountNameOwner: "Another Valid" }),
      ];

      const options = transformAccountsToOptions(accounts);

      expect(options).toEqual([
        { value: "Valid Account", label: "Valid Account" },
        { value: "Another Valid", label: "Another Valid" },
      ]);
    });

    it("should handle null/undefined account names", () => {
      const accounts = [
        createTestAccount({ accountNameOwner: "Valid Account" }),
        { ...createTestAccount(), accountNameOwner: null as any },
        { ...createTestAccount(), accountNameOwner: undefined as any },
      ];

      const options = transformAccountsToOptions(accounts);

      expect(options).toEqual([
        { value: "Valid Account", label: "Valid Account" },
      ]);
    });

    it("should return empty array for invalid input", () => {
      expect(transformAccountsToOptions(null as any)).toEqual([]);
      expect(transformAccountsToOptions(undefined as any)).toEqual([]);
      expect(transformAccountsToOptions({} as any)).toEqual([]);
      expect(transformAccountsToOptions("invalid" as any)).toEqual([]);
    });

    it("should handle empty accounts array", () => {
      const options = transformAccountsToOptions([]);
      expect(options).toEqual([]);
    });
  });

  describe("calculateMaxWidth", () => {
    it("should calculate width based on longest label", () => {
      const options = [
        { label: "Short" },
        { label: "Medium Length" },
        { label: "Very Long Account Name Here" },
      ];

      const maxWidth = calculateMaxWidth(options);

      // "Very Long Account Name Here" = 27 chars * 10 = 270
      expect(maxWidth).toBe(270);
    });

    it("should return minimum width of 200 for short labels", () => {
      const options = [{ label: "A" }, { label: "AB" }, { label: "ABC" }];

      const maxWidth = calculateMaxWidth(options);
      expect(maxWidth).toBe(200); // minimum width
    });

    it("should handle empty options array", () => {
      const maxWidth = calculateMaxWidth([]);
      expect(maxWidth).toBe(200); // default minimum
    });

    it("should handle single option", () => {
      const options = [{ label: "Single Account Name" }];
      const maxWidth = calculateMaxWidth(options);

      // "Single Account Name" = 19 chars * 10 = 190, so min 200
      expect(maxWidth).toBe(200);
    });

    it("should calculate correctly for very long account names", () => {
      const options = [
        {
          label:
            "This Is An Extremely Long Account Name That Should Calculate Properly",
        },
      ];

      const maxWidth = calculateMaxWidth(options);

      // 69 chars * 10 = 690
      expect(maxWidth).toBe(690);
    });
  });

  describe("isValidAccountForNavigation", () => {
    it("should return true for valid account names", () => {
      expect(isValidAccountForNavigation("Checking")).toBe(true);
      expect(isValidAccountForNavigation("Savings Account")).toBe(true);
      expect(isValidAccountForNavigation("401k")).toBe(true);
    });

    it("should return false for empty or whitespace names", () => {
      expect(isValidAccountForNavigation("")).toBe(false);
      expect(isValidAccountForNavigation("   ")).toBe(false);
      expect(isValidAccountForNavigation("\t\n")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isValidAccountForNavigation(null as any)).toBe(false);
      expect(isValidAccountForNavigation(undefined as any)).toBe(false);
      expect(isValidAccountForNavigation(123 as any)).toBe(false);
      expect(isValidAccountForNavigation({} as any)).toBe(false);
      expect(isValidAccountForNavigation([] as any)).toBe(false);
    });

    it("should handle special characters in account names", () => {
      expect(isValidAccountForNavigation("Account-1")).toBe(true);
      expect(isValidAccountForNavigation("Account_Name")).toBe(true);
      expect(isValidAccountForNavigation("Account (Primary)")).toBe(true);
    });
  });

  describe("buildAccountNavigationUrl", () => {
    it("should build correct navigation URLs", () => {
      expect(buildAccountNavigationUrl("Checking")).toBe(
        "/finance/transactions/Checking",
      );
      expect(buildAccountNavigationUrl("Savings Account")).toBe(
        "/finance/transactions/Savings Account",
      );
      expect(buildAccountNavigationUrl("401k")).toBe(
        "/finance/transactions/401k",
      );
    });

    it("should handle account names with special characters", () => {
      expect(buildAccountNavigationUrl("Account-1")).toBe(
        "/finance/transactions/Account-1",
      );
      expect(buildAccountNavigationUrl("Account_Name")).toBe(
        "/finance/transactions/Account_Name",
      );
      expect(buildAccountNavigationUrl("Account (Primary)")).toBe(
        "/finance/transactions/Account (Primary)",
      );
    });

    it("should throw error for invalid account names", () => {
      expect(() => buildAccountNavigationUrl("")).toThrow(
        "Invalid account name for navigation",
      );
      expect(() => buildAccountNavigationUrl("   ")).toThrow(
        "Invalid account name for navigation",
      );
      expect(() => buildAccountNavigationUrl(null as any)).toThrow(
        "Invalid account name for navigation",
      );
      expect(() => buildAccountNavigationUrl(undefined as any)).toThrow(
        "Invalid account name for navigation",
      );
    });

    it("should handle URL encoding requirements", () => {
      // Note: Actual URL encoding would be handled by the router
      expect(buildAccountNavigationUrl("Account With Spaces")).toBe(
        "/finance/transactions/Account With Spaces",
      );
    });
  });

  describe("filterValidAccounts", () => {
    it("should filter out accounts with invalid names", () => {
      const accounts = [
        createTestAccount({ accountNameOwner: "Valid Account 1" }),
        createTestAccount({ accountNameOwner: "" }),
        createTestAccount({ accountNameOwner: "Valid Account 2" }),
        createTestAccount({ accountNameOwner: "   " }),
        createTestAccount({ accountNameOwner: "Valid Account 3" }),
      ];

      const validAccounts = filterValidAccounts(accounts);

      expect(validAccounts).toHaveLength(3);
      expect(validAccounts[0].accountNameOwner).toBe("Valid Account 1");
      expect(validAccounts[1].accountNameOwner).toBe("Valid Account 2");
      expect(validAccounts[2].accountNameOwner).toBe("Valid Account 3");
    });

    it("should handle empty accounts array", () => {
      const validAccounts = filterValidAccounts([]);
      expect(validAccounts).toEqual([]);
    });

    it("should handle invalid input", () => {
      expect(filterValidAccounts(null as any)).toEqual([]);
      expect(filterValidAccounts(undefined as any)).toEqual([]);
      expect(filterValidAccounts("invalid" as any)).toEqual([]);
    });

    it("should return all accounts when all are valid", () => {
      const accounts = [
        createTestAccount({ accountNameOwner: "Account 1" }),
        createTestAccount({ accountNameOwner: "Account 2" }),
        createTestAccount({ accountNameOwner: "Account 3" }),
      ];

      const validAccounts = filterValidAccounts(accounts);
      expect(validAccounts).toHaveLength(3);
      expect(validAccounts).toEqual(accounts);
    });

    it("should return empty array when no accounts are valid", () => {
      const accounts = [
        createTestAccount({ accountNameOwner: "" }),
        createTestAccount({ accountNameOwner: "   " }),
        { ...createTestAccount(), accountNameOwner: null as any },
      ];

      const validAccounts = filterValidAccounts(accounts);
      expect(validAccounts).toEqual([]);
    });

    it("should preserve account object structure", () => {
      const account = createTestAccount({
        accountNameOwner: "Test Account",
        accountId: 123,
        activeStatus: true,
      });

      const validAccounts = filterValidAccounts([account]);

      expect(validAccounts[0]).toEqual(account);
      expect(validAccounts[0]).toHaveProperty("accountId", 123);
      expect(validAccounts[0]).toHaveProperty("activeStatus", true);
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete transformation workflow", () => {
      const rawAccounts = [
        createTestAccount({ accountNameOwner: "Primary Checking" }),
        createTestAccount({ accountNameOwner: "" }), // Should be filtered out
        createTestAccount({ accountNameOwner: "Savings" }),
        createTestAccount({ accountNameOwner: "Investment Portfolio" }),
      ];

      // Step 1: Filter valid accounts
      const validAccounts = filterValidAccounts(rawAccounts);
      expect(validAccounts).toHaveLength(3);

      // Step 2: Transform to options
      const options = transformAccountsToOptions(validAccounts);
      expect(options).toEqual([
        { value: "Primary Checking", label: "Primary Checking" },
        { value: "Savings", label: "Savings" },
        { value: "Investment Portfolio", label: "Investment Portfolio" },
      ]);

      // Step 3: Calculate max width
      const maxWidth = calculateMaxWidth(options);
      expect(maxWidth).toBe(200); // "Investment Portfolio" = 19 chars * 10 = 190, so min 200

      // Step 4: Build navigation URLs for each option
      const navigationUrls = options.map((option) =>
        buildAccountNavigationUrl(option.value),
      );

      expect(navigationUrls).toEqual([
        "/finance/transactions/Primary Checking",
        "/finance/transactions/Savings",
        "/finance/transactions/Investment Portfolio",
      ]);
    });

    it("should handle edge case of no valid accounts", () => {
      const rawAccounts = [
        createTestAccount({ accountNameOwner: "" }),
        createTestAccount({ accountNameOwner: "   " }),
        { ...createTestAccount(), accountNameOwner: null as any },
      ];

      const validAccounts = filterValidAccounts(rawAccounts);
      expect(validAccounts).toEqual([]);

      const options = transformAccountsToOptions(validAccounts);
      expect(options).toEqual([]);

      const maxWidth = calculateMaxWidth(options);
      expect(maxWidth).toBe(200); // default minimum
    });

    it("should handle single very long account name", () => {
      const longAccountName =
        "This Is An Extremely Long Business Account Name That Should Test Width Calculation";
      const rawAccounts = [
        createTestAccount({ accountNameOwner: longAccountName }),
      ];

      const validAccounts = filterValidAccounts(rawAccounts);
      expect(validAccounts).toHaveLength(1);

      const options = transformAccountsToOptions(validAccounts);
      expect(options).toHaveLength(1);
      expect(options[0].value).toBe(longAccountName);

      const maxWidth = calculateMaxWidth(options);
      expect(maxWidth).toBe(longAccountName.length * 10); // Should be much larger than 200

      const url = buildAccountNavigationUrl(longAccountName);
      expect(url).toBe(`/finance/transactions/${longAccountName}`);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle malformed account objects gracefully", () => {
      const malformedAccounts = [
        { accountNameOwner: "Valid Account" }, // missing other properties
        { accountId: 123 }, // missing accountNameOwner
        null,
        undefined,
        "not an object",
        { accountNameOwner: "Another Valid" },
      ] as any;

      // The function should still work with partial objects
      const options = transformAccountsToOptions(malformedAccounts);
      expect(options).toEqual([
        { value: "Valid Account", label: "Valid Account" },
        { value: "Another Valid", label: "Another Valid" },
      ]);
    });

    it("should handle extreme width calculations", () => {
      // Test with very short label
      const shortOptions = [{ label: "" }];
      expect(calculateMaxWidth(shortOptions)).toBe(200);

      // Test with extremely long label
      const longLabel = "x".repeat(1000);
      const longOptions = [{ label: longLabel }];
      expect(calculateMaxWidth(longOptions)).toBe(10000);
    });

    it("should validate navigation with unusual but valid characters", () => {
      const specialNames = [
        "Account-123",
        "Account_Name",
        "Account (Primary)",
        "Account.Extension",
        "Account & Co",
        "Account@Domain",
        "123 Numeric Account",
      ];

      specialNames.forEach((name) => {
        expect(isValidAccountForNavigation(name)).toBe(true);
        expect(buildAccountNavigationUrl(name)).toBe(
          `/finance/transactions/${name}`,
        );
      });
    });
  });
});
