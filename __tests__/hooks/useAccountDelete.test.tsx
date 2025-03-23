import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
// MSW v1 imports
import { rest } from "msw";
import { setupServer } from "msw/node";
import useAccountDelete from "../../hooks/useAccountDelete";
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

describe("useAccountDelete", () => {
  it("should delete an account successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    server.use(
      rest.delete(
        `https://finance.bhenning.com/api/account/delete/${mockAccount.accountNameOwner}`,
        (req, res, ctx) => {
          return res(ctx.status(204));
        },
      ),
    );

    queryClient.setQueryData(["account"], [mockAccount]);

    // Render the hook
    const { result } = renderHook(() => useAccountDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate({ oldRow: mockAccount });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the account was removed from the cache
    const updatedAccounts = queryClient.getQueryData<Account[]>(["account"]);
    expect(updatedAccounts).toEqual([]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    // Mock an API error
    server.use(
      rest.delete(
        `https://finance.bhenning.com/api/account/delete/${mockAccount.accountNameOwner}`,
        (req, res, ctx) => {
          return res(
            ctx.status(400),
            ctx.json({ response: "Cannot delete this account" }),
          );
        },
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useAccountDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockAccount });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this account"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockAccount: Account = {
      accountId: 123,
      accountNameOwner: "account_owner",
      accountType: "debit",
      activeStatus: true,
      moniker: "0000",
      outstanding: 100,
      future: 300,
      cleared: 200,
    };

    // Mock a network error
    server.use(
      rest.delete(
        `https://finance.bhenning.com/api/account/delete/${mockAccount.accountNameOwner}`,
        (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ message: "Network error" }));
        },
      ),
    );

    // Render the hook
    const { result } = renderHook(() => useAccountDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockAccount });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
