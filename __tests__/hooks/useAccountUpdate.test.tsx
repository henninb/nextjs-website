import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import useAccountUpdate from "../../hooks/useAccountUpdate";
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

// Mock jose package
jest.mock("jose", () => ({
  jwtVerify: jest.fn().mockResolvedValue(true),
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
  (queryClient) =>
  ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("useAccountUpdate", () => {
  it("should update an account successfully", async () => {
    const queryClient = createTestQueryClient();

    const oldAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    const newAccount: Account = {
      ...oldAccount,
      moniker: "1111",
      outstanding: 150,
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(newAccount), { status: 200 }),
      );

    queryClient.setQueryData(["account"], [oldAccount]);

    // Render the hook
    const { result } = renderHook(() => useAccountUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate({ oldRow: oldAccount, newRow: newAccount });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was updated correctly
    const updatedAccounts = queryClient.getQueryData<Account[]>(["account"]);
    expect(updatedAccounts).toEqual([newAccount]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const oldAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    const newAccount: Account = {
      ...oldAccount,
      moniker: "1111",
    };

    // Mock the fetch call to return an error response
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ response: "Cannot update this account" }),
          { status: 400 },
        ),
      );

    // Render the hook
    const { result } = renderHook(() => useAccountUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: oldAccount, newRow: newAccount });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });

  it("should handle 404 errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const oldAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    const newAccount: Account = {
      ...oldAccount,
      moniker: "1111",
    };

    // Mock the fetch call to return a 404 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Account not found" }), {
        status: 404,
      }),
    );

    // Render the hook
    const { result } = renderHook(() => useAccountUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: oldAccount, newRow: newAccount });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify 404 error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      "Resource not found (404).",
      expect.anything(),
    );

    consoleSpy.mockRestore();
  });

  it("should handle case when cache is empty", async () => {
    const queryClient = createTestQueryClient();

    const oldAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "credit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    const newAccount: Account = {
      ...oldAccount,
      accountNameOwner: "test_brian",
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(newAccount), { status: 200 }),
      );

    // Don't set any initial cache data

    // Render the hook
    const { result } = renderHook(() => useAccountUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate({ oldRow: oldAccount, newRow: newAccount });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was initialized with the new account
    const updatedAccounts = queryClient.getQueryData<Account[]>(["account"]);
    expect(updatedAccounts).toEqual([newAccount]);
  });
});
