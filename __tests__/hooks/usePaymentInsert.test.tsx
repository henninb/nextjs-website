import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import usePaymentInsert from "../../hooks/usePaymentInsert";
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

describe("usePaymentInsert", () => {
  it("should insert a payment successfully", async () => {
    const queryClient = createTestQueryClient();

    const inputPayment: Payment = {
      paymentId: 0,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const responsePayment: Payment = {
      paymentId: 789,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01").toISOString(),
      amount: 150.0,
      activeStatus: true,
      dateAdded: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    server.use(
      http.post("https://finance.bhenning.com/api/payment/insert", () => {
        return HttpResponse.json(responsePayment, { status: 201 });
      }),
    );

    // Set existing payments in cache
    const existingPayments: Payment[] = [
      {
        paymentId: 1,
        accountNameOwner: "existing_owner",
        sourceAccount: "existing_source",
        destinationAccount: "existing_dest",
        transactionDate: new Date("2023-11-01"),
        amount: 100.0,
        activeStatus: true,
      },
    ];
    queryClient.setQueryData(["payment"], existingPayments);

    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: inputPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was updated with new payment at the beginning
    const updatedPayments = queryClient.getQueryData<Payment[]>(["payment"]);
    expect(updatedPayments).toEqual([responsePayment, ...existingPayments]);
  });

  it("should handle case when cache is empty", async () => {
    const queryClient = createTestQueryClient();

    const inputPayment: Payment = {
      paymentId: 0,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    const responsePayment: Payment = {
      paymentId: 789,
      ...inputPayment,
      transactionDate: new Date("2023-12-01").toISOString(),
      dateAdded: new Date().toISOString(),
      dateUpdated: new Date().toISOString(),
    };

    server.use(
      http.post("https://finance.bhenning.com/api/payment/insert", () => {
        return HttpResponse.json(responsePayment, { status: 201 });
      }),
    );

    // Don't set any initial cache data - cache will be undefined

    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: inputPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Verify the cache was set with new payment only
    const updatedPayments = queryClient.getQueryData<Payment[]>(["payment"]);
    expect(updatedPayments).toEqual([responsePayment]);
  });

  it("should handle API errors with response message", async () => {
    const queryClient = createTestQueryClient();

    const inputPayment: Payment = {
      paymentId: 0,
      accountNameOwner: "invalid_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: -50.0, // Invalid amount
      activeStatus: true,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/payment/insert", () => {
        return HttpResponse.json(
          { response: "Invalid payment amount" },
          { status: 400 },
        );
      }),
    );

    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputPayment });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith("Invalid payment amount");
    expect(result.current.error?.message).toBe("Invalid payment amount");

    consoleSpy.mockRestore();
  });

  it("should handle API errors without response message", async () => {
    const queryClient = createTestQueryClient();

    const inputPayment: Payment = {
      paymentId: 0,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/payment/insert", () => {
        return HttpResponse.json({}, { status: 400 });
      }),
    );

    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputPayment });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith("No error message returned.");
    expect(result.current.error?.message).toBe("No error message returned.");

    consoleSpy.mockRestore();
  });

  it("should handle non-JSON error responses", async () => {
    const queryClient = createTestQueryClient();

    const inputPayment: Payment = {
      paymentId: 0,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/payment/insert", () => {
        return new HttpResponse("Server error", { status: 500 });
      }),
    );

    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createWrapper(queryClient),
    });

    const consoleSpy = jest.spyOn(console, "log");

    result.current.mutate({ payload: inputPayment });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining("Failed to parse error response:"),
    );

    consoleSpy.mockRestore();
  });

  it("should handle 204 no content response", async () => {
    const queryClient = createTestQueryClient();

    const inputPayment: Payment = {
      paymentId: 0,
      accountNameOwner: "test_owner",
      sourceAccount: "source123",
      destinationAccount: "dest456",
      transactionDate: new Date("2023-12-01"),
      amount: 150.0,
      activeStatus: true,
    };

    server.use(
      http.post("https://finance.bhenning.com/api/payment/insert", () => {
        return new HttpResponse(null, { status: 204 });
      }),
    );

    const { result } = renderHook(() => usePaymentInsert(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ payload: inputPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toBeNull();
  });
});
