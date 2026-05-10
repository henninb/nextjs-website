import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { insertValidationAmount } from "../../hooks/useValidationAmountInsert";
import useValidationAmountInsert from "../../hooks/useValidationAmountInsert";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    validationAmount: jest.fn((account: string) => ["validationAmount", account]),
    validationAmountAll: jest.fn((account: string) => ["validationAmountAll", account]),
  },
  addToList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "john" },
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;

const createTestValidationAmount = (
  overrides: Partial<ValidationAmount> = {},
): ValidationAmount => ({
  validationId: 1,
  validationDate: new Date("2024-01-01T00:00:00.000Z"),
  accountId: 100,
  amount: 1000.0,
  transactionState: "cleared" as TransactionState,
  activeStatus: true,
  dateAdded: new Date("2024-01-01T10:00:00.000Z"),
  dateUpdated: new Date("2024-01-01T10:00:00.000Z"),
  ...overrides,
});

describe("useValidationAmountInsert - insertValidationAmount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
  });

  describe("successful insertion", () => {
    it("should POST to /api/validation/amount", async () => {
      const payload = createTestValidationAmount();
      mockParseResponse.mockResolvedValue(payload);

      await insertValidationAmount("checking_john", payload);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/validation/amount");
    });

    it("should use POST method", async () => {
      const payload = createTestValidationAmount();
      mockParseResponse.mockResolvedValue(payload);

      await insertValidationAmount("checking_john", payload);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("POST");
    });

    it("should return the created validation amount", async () => {
      const payload = createTestValidationAmount({ validationId: 5 });
      mockParseResponse.mockResolvedValue(payload);

      const result = await insertValidationAmount("checking_john", payload);

      expect(result).toStrictEqual(payload);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 201 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const payload = createTestValidationAmount();
      mockParseResponse.mockResolvedValue(payload);

      await insertValidationAmount("checking_john", payload);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should send validation amount as JSON body", async () => {
      const payload = createTestValidationAmount({ amount: 2500.75 });
      mockParseResponse.mockResolvedValue(payload);

      await insertValidationAmount("checking_john", payload);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.amount).toBe(2500.75);
    });

    it("should handle different transaction states", async () => {
      const states: TransactionState[] = ["cleared", "outstanding", "future"];

      for (const transactionState of states) {
        jest.clearAllMocks();
        mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
        const payload = createTestValidationAmount({ transactionState });
        mockParseResponse.mockResolvedValue(payload);

        const result = await insertValidationAmount("checking_john", payload);

        expect(result.transactionState).toBe(transactionState);
      }
    });

    it("should handle high-value amounts", async () => {
      const payload = createTestValidationAmount({ amount: 999999.99 });
      mockParseResponse.mockResolvedValue(payload);

      const result = await insertValidationAmount("checking_john", payload);

      expect(result.amount).toBe(999999.99);
    });
  });

  describe("error handling", () => {
    it("should propagate 400 bad request error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Invalid validation amount data", 400),
      );
      const payload = createTestValidationAmount();

      await expect(insertValidationAmount("checking_john", payload)).rejects.toThrow(
        "Invalid validation amount data",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Validation amount already exists", 409),
      );
      const payload = createTestValidationAmount();

      await expect(insertValidationAmount("checking_john", payload)).rejects.toThrow(
        "Validation amount already exists",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const payload = createTestValidationAmount();

      await expect(insertValidationAmount("checking_john", payload)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const payload = createTestValidationAmount();

      await expect(insertValidationAmount("checking_john", payload)).rejects.toThrow(
        "Network request failed",
      );
    });
  });

  describe("request format", () => {
    it("should include validation amount data in body", async () => {
      const payload = createTestValidationAmount();
      mockParseResponse.mockResolvedValue(payload);

      await insertValidationAmount("checking_john", payload);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
    });

    it("should serialize body as JSON", async () => {
      const payload = createTestValidationAmount({ amount: 1234.56 });
      mockParseResponse.mockResolvedValue(payload);

      await insertValidationAmount("checking_john", payload);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(() => JSON.parse(options?.body as string)).not.toThrow();
    });
  });

  describe("various account names", () => {
    it.each(["checking_john", "savings_jane", "visa_bob", "amex_alice"])(
      "should insert validation amount for account '%s'",
      async (accountNameOwner) => {
        const payload = createTestValidationAmount();
        mockParseResponse.mockResolvedValue(payload);

        await insertValidationAmount(accountNameOwner, payload);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          "/api/validation/amount",
          expect.objectContaining({ method: "POST" }),
        );
      },
    );
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useValidationAmountInsert default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useValidationAmountInsert hook - renderHook tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
    const mockUseAuth = jest.requireMock("../../components/AuthProvider").useAuth as jest.Mock;
    mockUseAuth.mockImplementation(() => ({
      isAuthenticated: true,
      loading: false,
      user: { username: "testUser" },
      login: jest.fn(),
      logout: jest.fn(),
    }));
  });

  it("onSuccess sets validationAmount cache and invalidates all-list for the account", async () => {
    const queryClient = createHookQueryClient();
    const returned = createTestValidationAmount({ validationId: 10, amount: 500 });
    mockParseResponse.mockResolvedValue(returned);
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useValidationAmountInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        accountNameOwner: "checking_john",
        payload: createTestValidationAmount(),
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(queryClient.getQueryData(["validationAmount", "checking_john"])).toStrictEqual(returned);
    expect(invalidateSpy).toHaveBeenCalledWith(
      expect.objectContaining({ queryKey: ["validationAmountAll", "checking_john"] }),
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    const { FetchError } = jest.requireMock("../../utils/fetchUtils");
    mockFetchWithErrorHandling.mockRejectedValue(new FetchError("Insert failed", 400));

    const { result } = renderHook(() => useValidationAmountInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          accountNameOwner: "checking_john",
          payload: createTestValidationAmount(),
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });

  it("throws when user is not logged in", async () => {
    const mockUseAuth = jest.requireMock("../../components/AuthProvider").useAuth as jest.Mock;
    mockUseAuth.mockImplementation(() => ({
      isAuthenticated: false,
      loading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    }));

    const queryClient = createHookQueryClient();
    const { result } = renderHook(() => useValidationAmountInsert(), {
      wrapper: createHookWrapper(queryClient),
    });

    act(() => {
      result.current.mutate({
        accountNameOwner: "checking_john",
        payload: createTestValidationAmount(),
      });
    });

    await waitFor(() => expect(result.current.isError).toBe(true), { timeout: 3000 });
    expect(result.current.error?.message).toContain("User must be logged in");
  });
});
