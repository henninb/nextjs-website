import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import usePaymentDelete from "../../hooks/usePaymentDelete";
import Payment from "../../model/Payment";

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

// Create a wrapper component with all providers
const createWrapper =
  (queryClient: QueryClient) =>
  ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

describe("usePaymentDelete", () => {
  it("should delete a payment successfully", async () => {
    const queryClient = createTestQueryClient();

    const mockPayment: Payment = {
      paymentId: 1,
      accountNameOwner: "ownerA",
      transactionDate: new Date(),
      amount: 500,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    server.use(
      http.delete(
        `https://finance.bhenning.com/api/payment/delete/${mockPayment.paymentId}`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    );

    // Set initial cache data
    queryClient.setQueryData(["payment"], [mockPayment]);

    // Render the hook
    const { result } = renderHook(() => usePaymentDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Execute the mutation
    result.current.mutate({ oldRow: mockPayment });

    // Wait for the mutation to complete
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify that the payment was removed from the cache
    const updatedPayments = queryClient.getQueryData<Payment[]>(["payment"]);
    expect(updatedPayments).toEqual([]);
  });

  it("should handle API errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockPayment: Payment = {
      paymentId: 1,
      accountNameOwner: "ownerA",
      transactionDate: new Date(),
      amount: 500,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock an API error
    server.use(
      http.delete(
        `https://finance.bhenning.com/api/payment/delete/${mockPayment.paymentId}`,
        () =>
          HttpResponse.json(
            { response: "Cannot delete this payment" },
            { status: 400 },
          ),
      ),
    );

    // Render the hook
    const { result } = renderHook(() => usePaymentDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockPayment });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Cannot delete this payment"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors correctly", async () => {
    const queryClient = createTestQueryClient();

    const mockPayment: Payment = {
      paymentId: 1,
      accountNameOwner: "ownerA",
      transactionDate: new Date(),
      amount: 500,
      activeStatus: true,
      dateAdded: new Date(),
      dateUpdated: new Date(),
    };

    // Mock a network error
    server.use(
      http.delete(
        `https://finance.bhenning.com/api/payment/delete/${mockPayment.paymentId}`,
        () => HttpResponse.json({ message: "Network error" }, { status: 500 }),
      ),
    );

    // Render the hook
    const { result } = renderHook(() => usePaymentDelete(), {
      wrapper: createWrapper(queryClient),
    });

    // Spy on console.log
    const consoleSpy = jest.spyOn(console, "log");

    // Execute the mutation
    result.current.mutate({ oldRow: mockPayment });

    // Wait for the mutation to fail
    await waitFor(() => expect(result.current.isError).toBe(true));

    // Verify error was logged
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
