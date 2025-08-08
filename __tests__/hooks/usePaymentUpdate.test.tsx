import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
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

describe("usePaymentUpdate", () => {
  it("should update a payment successfully", async () => {
    const queryClient = createTestQueryClient();

    const oldPayment: Payment = {
      paymentId: 123,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const newPayment: Payment = {
      ...oldPayment,
      amount: 200.0,
      destinationAccount: "new_dest789",
    };

    const responsePayment: Payment = {
      ...newPayment,
      transactionDate: new Date("2023-12-01").toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responsePayment), { status: 200 }),
      );

    // Set existing payments in cache
    const existingPayments: Payment[] = [
      oldPayment,
      {
        paymentId: 456,
        accountNameOwner: "other_owner",
        sourceAccount: "other_source",
        destinationAccount: "other_dest",
        transactionDate: new Date("2023-11-01"),
        amount: 100.0,
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["payment"], existingPayments);

    const { result } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was updated correctly
    const updatedPayments = queryClient.getQueryData<Payment[]>(["payment"]);
    expect(updatedPayments).toHaveLength(2);
    expect(updatedPayments?.[0]).toEqual({
      ...oldPayment,
      ...responsePayment,
    });
    expect(updatedPayments?.[1].paymentId).toBe(456); // Other payment unchanged
  });

  it("should handle 404 errors and return fallback data", async () => {
    const queryClient = createTestQueryClient();

    const oldPayment: Payment = {
      paymentId: 999,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const newPayment: Payment = {
      ...oldPayment,
      amount: 200.0,
    };

    // Mock the fetch call to return a 404 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Payment not found" }), {
        status: 404,
      }),
    );

    const consoleSpy = jest.spyOn(console, "log");

    const { result } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Should return the newPayment as fallback for 404
    expect(result.current.data).toEqual(newPayment);
    expect(consoleSpy).toHaveBeenCalledWith("Resource not found (404).");

    consoleSpy.mockRestore();
  });

  it("should handle other HTTP errors", async () => {
    const queryClient = createTestQueryClient();

    const oldPayment: Payment = {
      paymentId: 123,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const newPayment: Payment = {
      ...oldPayment,
      amount: -50.0, // Invalid amount
    };

    // Mock the fetch call to return a 400 error
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Bad Request" }), {
        status: 400,
      }),
    );

    const { result } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toContain(
      "Failed to update payment state",
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Error occurred during mutation:"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle network errors", async () => {
    const queryClient = createTestQueryClient();

    const oldPayment: Payment = {
      paymentId: 123,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const newPayment: Payment = {
      ...oldPayment,
      amount: 200.0,
    };

    // Mock the fetch call to throw a network error
    global.fetch = jest
      .fn()
      .mockRejectedValueOnce(new Error("Network failure"));

    const { result } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("An error occurred: Network failure"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle case when cache is empty", async () => {
    const queryClient = createTestQueryClient();

    const oldPayment: Payment = {
      paymentId: 123,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const newPayment: Payment = {
      ...oldPayment,
      amount: 200.0,
    };

    const responsePayment: Payment = {
      ...newPayment,
      dateUpdated: new Date(),
    };

    // Mock the fetch call directly for this test
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responsePayment), { status: 200 }),
      );

    // Don't set any initial cache data

    const { result } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Cache should remain empty since onSuccess only updates if oldData exists
    const updatedPayments = queryClient.getQueryData<Payment[]>(["payment"]);
    expect(updatedPayments).toBeUndefined();
  });
});
