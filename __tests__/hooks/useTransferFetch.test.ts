import React from "react";
import { renderHook } from "@testing-library/react";
import useTransferFetch from "../../hooks/useTransferFetch";
import Transfer from "../../model/Transfer";
import { createModernFetchMock, createTestTransfer } from "../../testHelpers";
import { FetchError } from "../../utils/fetchUtils";

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("../../utils/logger", () => {
  const logger = createMockLogger();
  return {
    createHookLogger: jest.fn(() => logger),
    __mockLogger: logger,
  };
});

jest.mock("../../utils/queryConfig", () => {
  const actual = jest.requireActual("../../utils/queryConfig");
  const mockUseAuthenticatedQuery = jest.fn();
  return {
    ...actual,
    useAuthenticatedQuery: mockUseAuthenticatedQuery,
    __mockUseAuthenticatedQuery: mockUseAuthenticatedQuery,
  };
});

const { __mockLogger: mockLogger } = jest.requireMock("../../utils/logger") as {
  __mockLogger: ReturnType<typeof createMockLogger>;
};
const { __mockUseAuthenticatedQuery: mockUseAuthenticatedQuery } =
  jest.requireMock("../../utils/queryConfig") as {
    __mockUseAuthenticatedQuery: jest.Mock;
  };

describe("useTransferFetch Modern Endpoint (unit)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLogger.debug.mockClear();
    mockLogger.error.mockClear();
    mockUseAuthenticatedQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      error: null,
    });
  });

  it("calls useAuthenticatedQuery with modern endpoint query fn", async () => {
    const transfers = [createTestTransfer()];
    mockUseAuthenticatedQuery.mockReturnValue({
      data: transfers,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
    });

    const { result } = renderHook(() => useTransferFetch());

    expect(result.current.data).toEqual(transfers);
    expect(mockUseAuthenticatedQuery).toHaveBeenCalledWith(
      ["transfer"],
      expect.any(Function),
    );

    const queryFn = mockUseAuthenticatedQuery.mock.calls[0][1];
    global.fetch = createModernFetchMock([]);
    await queryFn({ signal: new AbortController().signal });

    expect(fetch).toHaveBeenCalledWith(
      "/api/transfer/active",
      expect.objectContaining({
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }),
    );
  });

  it("surfaces query errors", () => {
    const fetchError = new FetchError("Unauthorized", 401, "Unauthorized");
    mockUseAuthenticatedQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: fetchError,
    });

    const { result } = renderHook(() => useTransferFetch());

    expect(result.current.isError).toBe(true);
    expect(result.current.error).toBe(fetchError);
  });

  it("logs success metadata when data is returned", () => {
    const transfers = [
      createTestTransfer(),
      createTestTransfer({ transferId: 2 }),
    ];
    mockUseAuthenticatedQuery.mockReturnValue({
      data: transfers,
      isLoading: false,
      isError: false,
      isSuccess: true,
      error: null,
    });

    renderHook(() => useTransferFetch());

    expect(mockLogger.debug).toHaveBeenCalledWith(
      "Fetched transfers",
      expect.objectContaining({ count: transfers.length }),
    );
  });

  it("logs errors when query reports failure", () => {
    const fetchError = new FetchError(
      "Internal error",
      500,
      "Internal Server Error",
    );
    mockUseAuthenticatedQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      isSuccess: false,
      error: fetchError,
    });

    renderHook(() => useTransferFetch());

    expect(mockLogger.error).toHaveBeenCalledWith("Fetch failed", fetchError);
  });
});
