import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
// For Jest tests in Node environment, we need to manually create a server
// instead of importing from msw/node which doesn't exist in MSW v2
import { setupServer } from "msw/node";
import useAccountDelete from "../../hooks/useAccountDelete";
import Account from "../../model/Account";
import { AuthProvider } from "../../components/AuthProvider";
import LayoutNew from "../../components/LayoutNew";

// Setup MSW server for Node environment
const server = setupServer();

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Create a fresh QueryClient for each test
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

// Create a wrapper component with all providers
const createWrapper = (queryClient) => ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LayoutNew>{children}</LayoutNew>
    </AuthProvider>
  </QueryClientProvider>
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
      http.delete(
        `https://finance.lan/api/account/delete/${mockAccount.accountNameOwner}`,
        () => {
          return HttpResponse.text("", { status: 204 });
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
      http.delete(
        `https://finance.lan/api/account/delete/${mockAccount.accountNameOwner}`,
        () => {
          return HttpResponse.json(
            { response: "Cannot delete this account" },
            { status: 400 },
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
      http.delete(
        `https://finance.lan/api/account/delete/${mockAccount.accountNameOwner}`,
        () => {
          return HttpResponse.error();
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
