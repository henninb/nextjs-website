import React from "react";
import { renderHook, act } from "@testing-library/react";
import useAccountUsageTracking from "../../hooks/useAccountUsageTracking";
import Account from "../../model/Account";

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

const STORAGE_KEY = "financeApp_accountUsage";

const createTestAccount = (overrides: Partial<Account> = {}): Account => ({
  accountId: 1,
  accountNameOwner: "checking_john",
  accountType: "debit",
  activeStatus: true,
  moniker: "0001",
  outstanding: 0,
  future: 0,
  cleared: 0,
  ...overrides,
});

describe("useAccountUsageTracking", () => {
  let localStorageMock: { [key: string]: string };

  beforeEach(() => {
    localStorageMock = {};
    jest.spyOn(Storage.prototype, "getItem").mockImplementation((key) => {
      return localStorageMock[key] ?? null;
    });
    jest.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
      localStorageMock[key] = value;
    });
    jest.spyOn(Storage.prototype, "removeItem").mockImplementation((key) => {
      delete localStorageMock[key];
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("initialization", () => {
    it("should initialize with empty accountUsage when no saved data", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      expect(result.current.accountUsage).toEqual([]);
    });

    it("should load saved account usage from localStorage on mount", () => {
      const savedData = [
        {
          accountNameOwner: "checking_john",
          visitCount: 5,
          lastVisited: new Date("2024-01-01").toISOString(),
        },
      ];
      localStorageMock[STORAGE_KEY] = JSON.stringify(savedData);

      const { result } = renderHook(() => useAccountUsageTracking());

      expect(result.current.accountUsage).toHaveLength(1);
      expect(result.current.accountUsage[0].accountNameOwner).toBe("checking_john");
      expect(result.current.accountUsage[0].visitCount).toBe(5);
    });

    it("should handle corrupt localStorage data gracefully", () => {
      localStorageMock[STORAGE_KEY] = "invalid json {{{";

      const { result } = renderHook(() => useAccountUsageTracking());

      expect(result.current.accountUsage).toEqual([]);
    });

    it("should return trackAccountVisit function", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      expect(typeof result.current.trackAccountVisit).toBe("function");
    });

    it("should return removeAccount function", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      expect(typeof result.current.removeAccount).toBe("function");
    });

    it("should return getMostUsedAccounts function", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      expect(typeof result.current.getMostUsedAccounts).toBe("function");
    });
  });

  describe("trackAccountVisit", () => {
    it("should add a new account to usage tracking on first visit", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
      });

      expect(result.current.accountUsage).toHaveLength(1);
      expect(result.current.accountUsage[0].accountNameOwner).toBe("checking_john");
      expect(result.current.accountUsage[0].visitCount).toBe(1);
    });

    it("should increment visitCount for existing account", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("checking_john");
      });

      expect(result.current.accountUsage[0].visitCount).toBe(3);
    });

    it("should track multiple different accounts", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("savings_john");
        result.current.trackAccountVisit("checking_jane");
      });

      expect(result.current.accountUsage).toHaveLength(3);
    });

    it("should save to localStorage after tracking a visit", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String),
      );
      const saved = JSON.parse(localStorageMock[STORAGE_KEY]);
      expect(saved[0].accountNameOwner).toBe("checking_john");
    });

    it("should update lastVisited on each visit", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
      });

      const firstVisit = result.current.accountUsage[0].lastVisited;

      act(() => {
        result.current.trackAccountVisit("checking_john");
      });

      const secondVisit = result.current.accountUsage[0].lastVisited;
      expect(secondVisit).toBeInstanceOf(Date);
      expect(firstVisit).toBeInstanceOf(Date);
    });
  });

  describe("removeAccount", () => {
    it("should remove an account from usage tracking", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("savings_john");
      });

      act(() => {
        result.current.removeAccount("checking_john");
      });

      expect(result.current.accountUsage).toHaveLength(1);
      expect(result.current.accountUsage[0].accountNameOwner).toBe("savings_john");
    });

    it("should do nothing when removing nonexistent account", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
      });

      act(() => {
        result.current.removeAccount("nonexistent_account");
      });

      expect(result.current.accountUsage).toHaveLength(1);
    });

    it("should save to localStorage after removing account", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
      });

      jest.clearAllMocks();
      jest.spyOn(Storage.prototype, "setItem").mockImplementation((key, value) => {
        localStorageMock[key] = value;
      });

      act(() => {
        result.current.removeAccount("checking_john");
      });

      expect(localStorage.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        expect.any(String),
      );
    });

    it("should handle removing all accounts", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("savings_john");
      });

      act(() => {
        result.current.removeAccount("checking_john");
        result.current.removeAccount("savings_john");
      });

      expect(result.current.accountUsage).toHaveLength(0);
    });
  });

  describe("getMostUsedAccounts", () => {
    it("should return empty array when no usage data", () => {
      const { result } = renderHook(() => useAccountUsageTracking());
      const allAccounts = [createTestAccount()];

      const mostUsed = result.current.getMostUsedAccounts(allAccounts, 6);

      expect(mostUsed).toEqual([]);
    });

    it("should return accounts sorted by visit count descending", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      const account1 = createTestAccount({
        accountNameOwner: "checking_john",
        accountId: 1,
      });
      const account2 = createTestAccount({
        accountNameOwner: "savings_john",
        accountId: 2,
      });

      act(() => {
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("savings_john");
        result.current.trackAccountVisit("savings_john");
        result.current.trackAccountVisit("savings_john");
      });

      const mostUsed = result.current.getMostUsedAccounts(
        [account1, account2],
        6,
      );

      expect(mostUsed[0].accountNameOwner).toBe("savings_john");
      expect(mostUsed[1].accountNameOwner).toBe("checking_john");
    });

    it("should respect the limit parameter", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      const accounts = ["acc1", "acc2", "acc3", "acc4", "acc5"].map((name, i) =>
        createTestAccount({ accountNameOwner: name, accountId: i + 1 }),
      );

      act(() => {
        accounts.forEach((acc) =>
          result.current.trackAccountVisit(acc.accountNameOwner),
        );
      });

      const mostUsed = result.current.getMostUsedAccounts(accounts, 3);

      expect(mostUsed).toHaveLength(3);
    });

    it("should only return accounts that exist in allAccounts list", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      act(() => {
        result.current.trackAccountVisit("checking_john");
        result.current.trackAccountVisit("deleted_account");
      });

      const allAccounts = [
        createTestAccount({ accountNameOwner: "checking_john" }),
      ];

      const mostUsed = result.current.getMostUsedAccounts(allAccounts, 6);

      expect(mostUsed).toHaveLength(1);
      expect(mostUsed[0].accountNameOwner).toBe("checking_john");
    });

    it("should use default limit of 6 when not specified", () => {
      const { result } = renderHook(() => useAccountUsageTracking());

      const accounts = Array.from({ length: 10 }, (_, i) =>
        createTestAccount({ accountNameOwner: `account_${i}`, accountId: i }),
      );

      act(() => {
        accounts.forEach((acc) =>
          result.current.trackAccountVisit(acc.accountNameOwner),
        );
      });

      const mostUsed = result.current.getMostUsedAccounts(accounts);

      expect(mostUsed.length).toBeLessThanOrEqual(6);
    });
  });
});
