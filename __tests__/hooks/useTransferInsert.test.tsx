import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import useTransferInsert from "../../hooks/useTransferInsert";
import Transfer from "../../model/Transfer";

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useTransferInsert", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = createTestQueryClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Successful Transfer Insertion", () => {
    it("inserts a transfer successfully", async () => {
      const inputTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "checking_account",
        destinationAccount: "savings_account",
        transactionDate: new Date("2024-01-15"),
        amount: 500.00,
        description: "Monthly savings transfer",
        category: "transfer",
        notes: "Regular transfer",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      const mockResponse: Transfer = {
        transferId: 123,
        sourceAccount: "checking_account",
        destinationAccount: "savings_account",
        transactionDate: new Date("2024-01-15"),
        amount: 500.00,
        description: "Monthly savings transfer",
        category: "transfer",
        notes: "Regular transfer",
        activeStatus: true,
        accountNameOwner: "test_user",
      };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: inputTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(fetch).toHaveBeenCalledWith("/api/transfer/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: inputTransfer.amount,
          transactionDate: inputTransfer.transactionDate,
          ...inputTransfer,
        }),
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("applies overRideTransferValues correctly", async () => {
      const inputTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "account_1",
        destinationAccount: "account_2",
        transactionDate: new Date("2024-02-01"),
        amount: 250.75,
        description: "Test transfer",
        // These fields should be overridden
        category: "original_category",
        notes: "original_notes",
        activeStatus: false,
        accountNameOwner: "original_owner",
      };

      const mockResponse = { ...inputTransfer, transferId: 456 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: inputTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that amount and transactionDate are prioritized in the override
      const expectedPayload = {
        amount: inputTransfer.amount,
        transactionDate: inputTransfer.transactionDate,
        ...inputTransfer,
      };

      expect(fetch).toHaveBeenCalledWith("/api/transfer/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(expectedPayload),
      });
    });

    it("updates query cache correctly after successful insertion", async () => {
      const existingTransfers = [
        { transferId: 1, amount: 100.00, sourceAccount: "account_1" },
        { transferId: 2, amount: 200.00, sourceAccount: "account_2" },
      ];

      // Set initial query data
      queryClient.setQueryData(["transfer"], existingTransfers);

      const newTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "account_3",
        destinationAccount: "account_4",
        transactionDate: new Date("2024-01-01"),
        amount: 300.00,
        description: "New transfer",
      };

      const mockResponse = { ...newTransfer, transferId: 3 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: newTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that cache was updated with new transfer at the beginning
      const updatedTransfers = queryClient.getQueryData(["transfer"]);
      expect(updatedTransfers).toEqual([mockResponse, ...existingTransfers]);
    });

    it("initializes cache with empty array if no existing data", async () => {
      // No initial data in cache
      expect(queryClient.getQueryData(["transfer"])).toBeUndefined();

      const newTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "account_1",
        destinationAccount: "account_2",
        transactionDate: new Date("2024-01-01"),
        amount: 150.00,
        description: "First transfer",
      };

      const mockResponse = { ...newTransfer, transferId: 1 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: newTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that cache was initialized with the new transfer
      const updatedTransfers = queryClient.getQueryData(["transfer"]);
      expect(updatedTransfers).toEqual([mockResponse]);
    });
  });

  describe("Error Handling", () => {
    it("handles API error responses with error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          response: "Invalid transfer data: Source and destination accounts cannot be the same",
        }),
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      const transfer: Transfer = {
        transferId: 0,
        sourceAccount: "same_account",
        destinationAccount: "same_account",
        transactionDate: new Date(),
        amount: 100.00,
        description: "Invalid transfer",
      };

      result.current.mutate({
        payload: transfer,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Invalid transfer data: Source and destination accounts cannot be the same")
      );
    });

    it("handles API error responses without error message", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Failed to parse error response: No error message returned.")
      );
    });

    it("handles JSON parsing errors in error response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => {
          throw new Error("Invalid JSON response");
        },
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        new Error("Failed to parse error response: Invalid JSON response")
      );
    });

    it("handles network errors", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Network connection failed")
      );

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error("Network connection failed"));
    });

    it("logs error correctly in onError callback", async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Test error")
      );

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));

      consoleSpy.mockRestore();
    });

    it("handles undefined errors in onError callback", async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Force an undefined error condition
      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      // Manually trigger onError with undefined
      result.current.mutate({
        payload: {} as Transfer,
      });

      (global.fetch as jest.Mock).mockRejectedValueOnce(undefined);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("handles 204 No Content response", async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 204,
        json: async () => ({}),
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it("handles transfers with minimal required fields", async () => {
      const minimalTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "account_a",
        destinationAccount: "account_b",
        transactionDate: new Date("2024-01-01"),
        amount: 1.00,
        description: "Minimal",
      };

      const mockResponse = { ...minimalTransfer, transferId: 999 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: minimalTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles transfers with all optional fields", async () => {
      const fullTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "detailed_source",
        destinationAccount: "detailed_destination",
        transactionDate: new Date("2024-06-15"),
        amount: 1234.56,
        description: "Detailed transfer with all fields",
        category: "savings",
        notes: "This is a comprehensive transfer with all optional fields filled",
        activeStatus: true,
        accountNameOwner: "detailed_user",
        dueDate: new Date("2024-06-20"),
        transactionType: "transfer",
        transactionState: "pending",
        accountType: "credit",
        reoccurringType: "monthly",
      };

      const mockResponse = { ...fullTransfer, transferId: 555 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: fullTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);

      // Verify that the override function prioritizes amount and transactionDate
      expect(fetch).toHaveBeenCalledWith("/api/transfer/insert", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          amount: fullTransfer.amount,
          transactionDate: fullTransfer.transactionDate,
          ...fullTransfer,
        }),
      });
    });

    it("handles zero amount transfers", async () => {
      const zeroTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "account_1",
        destinationAccount: "account_2",
        transactionDate: new Date("2024-01-01"),
        amount: 0.00,
        description: "Zero amount transfer",
      };

      const mockResponse = { ...zeroTransfer, transferId: 0 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: zeroTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });

    it("handles negative amount transfers", async () => {
      const negativeTransfer: Transfer = {
        transferId: 0,
        sourceAccount: "account_1",
        destinationAccount: "account_2",
        transactionDate: new Date("2024-01-01"),
        amount: -100.00,
        description: "Reversal transfer",
      };

      const mockResponse = { ...negativeTransfer, transferId: -1 };

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        payload: negativeTransfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
    });
  });

  describe("Mutation State Management", () => {
    it("resets state correctly between mutations", async () => {
      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      // First mutation - success
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ transferId: 1 }),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBeNull();

      // Second mutation - error
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ response: "Bad request" }),
      });

      result.current.mutate({
        payload: {} as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.isSuccess).toBe(false);
      expect(result.current.error).toEqual(new Error("Bad request"));
    });

    it("handles multiple concurrent mutations correctly", async () => {
      const { result } = renderHook(() => useTransferInsert(), {
        wrapper: createWrapper(queryClient),
      });

      // Mock multiple successful responses
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ transferId: 1, amount: 100 }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          json: async () => ({ transferId: 2, amount: 200 }),
        });

      // Start two mutations
      result.current.mutate({
        payload: { amount: 100 } as Transfer,
      });

      result.current.mutate({
        payload: { amount: 200 } as Transfer,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should have made two fetch calls
      expect(fetch).toHaveBeenCalledTimes(2);
    });
  });
});