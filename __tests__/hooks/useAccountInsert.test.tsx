import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useAccountInsert from "../../hooks/useAccountInsert";
import Account from "../../model/Account";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
  }),
}));

// Setup MSW server for Node environment
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create a fresh QueryClient for each test
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useAccountInsert", () => {
  it("should insert an account successfully", async () => {
    const queryClient = createTestQueryClient();

    const inputAccount: Account = {
      accountNameOwner: "test_account",
      accountType: "debit",
      activeStatus: true,
      moniker: "1234",
      outstanding: 0,
      future: 0,
      cleared: 0,
    };

    const responseAccount: Account = {
      accountId: 123,
      ...inputAccount,
      dateAdded: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    server.use(
      http.post("https://finance.bhenning.com/api/account/insert", () => {
        return HttpResponse.json(responseAccount, { status: 201 });
      }),
    );

    // Set existing accounts in cache
    const existingAccounts: Account[] = [
      {
        accountId: 1,
        accountNameOwner: "existing_account",
        accountType: "credit",
        activeStatus: true,
        moniker: "0000",
        outstanding: 100,
        future: 200,
        cleared: 50,
      },
    ];
    queryClient.setQueryData(["account"], existingAccounts);

    const { result } = renderHook(() => useAccountInsert(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log to verify payload logging
    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputAccount });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was updated with new account at the beginning
    const updatedAccounts = queryClient.getQueryData<Account[]>(["account"]);
    expect(updatedAccounts).toEqual([responseAccount, ...existingAccounts]);

    // Verify console.log was called with payload
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("accountNameOwner"));

    consoleSpy.mockRestore();
  });

  it("should handle case when cache is empty", async () => {
    const queryClient = createTestQueryClient();

    const inputAccount: Account = {
      accountNameOwner: "test_account",
      accountType: "debit",
      activeStatus: true,
      moniker: "1234",
      outstanding: 0,
      future: 0,
      cleared: 0,
    };

    const responseAccount: Account = {
      accountId: 123,
      ...inputAccount,
      dateAdded: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    server.use(
      http.post("https://finance.bhenning.com/api/account/insert", () => {
        return HttpResponse.json(responseAccount, { status: 201 });
      }),
    );

    // Don't set any initial cache data

    const { result } = renderHook(() => useAccountInsert(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: inputAccount });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was set with new account only
    const updatedAccounts = queryClient.getQueryData<Account[]>(["account"]);
    expect(updatedAccounts).toEqual([responseAccount]);
  });

  it("should handle API errors with response message", async () => {
    const queryClient = createTestQueryClient();

    const inputAccount: Account = {
      accountNameOwner: "duplicate_account",
      accountType: "debit",
      activeStatus: true,
      moniker: "1234",
      outstanding: 0,
      future: 0,
      cleared: 0,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/account/insert", () => {
        return HttpResponse.json(
          { response: "Account already exists" },
          { status: 400 },
        );
      }),
    );

    const { result } = renderHook(() => useAccountInsert(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputAccount });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith("Account already exists");
    expect(result.current.error?.message).toBe("Account already exists");

    consoleSpy.mockRestore();
  });

  it("should handle API errors without response message", async () => {
    const queryClient = createTestQueryClient();

    const inputAccount: Account = {
      accountNameOwner: "test_account",
      accountType: "debit",
      activeStatus: true,
      moniker: "1234",
      outstanding: 0,
      future: 0,
      cleared: 0,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/account/insert", () => {
        return HttpResponse.json({}, { status: 400 });
      }),
    );

    const { result } = renderHook(() => useAccountInsert(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputAccount });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith("No error message returned.");
    expect(result.current.error?.message).toBe("No error message returned.");

    consoleSpy.mockRestore();
  });

  it("should handle non-JSON error responses", async () => {
    const queryClient = createTestQueryClient();

    const inputAccount: Account = {
      accountNameOwner: "test_account",
      accountType: "debit",
      activeStatus: true,
      moniker: "1234",
      outstanding: 0,
      future: 0,
      cleared: 0,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/account/insert", () => {
        return new HttpResponse("Server error", { status: 500 });
      }),
    );

    const { result } = renderHook(() => useAccountInsert(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputAccount });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse error response:"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle 204 no content response", async () => {
    const queryClient = createTestQueryClient();

    const inputAccount: Account = {
      accountNameOwner: "test_account",
      accountType: "debit",
      activeStatus: true,
      moniker: "1234",
      outstanding: 0,
      future: 0,
      cleared: 0,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/account/insert", () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => useAccountInsert(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: inputAccount });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });

});