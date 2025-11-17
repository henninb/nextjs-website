import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
import usePaymentFetch from "../../hooks/usePaymentFetch";
import Payment from "../../model/Payment";
import { createModernErrorFetchMock } from "../../testHelpers.modern";

function createMockLogger() {
  return {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/logger", () => {
  const logger = createMockLogger();
  return {
    createHookLogger: jest.fn(() => logger),
    __mockLogger: logger,
  };
});

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeNumericId: jest.fn((value) => value),
  },
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: null,
    login: jest.fn(),
    logout: jest.fn(),
  }),
}));

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
    pathname: "/",
    route: "/",
    asPath: "/",
    query: {},
  }),
}));

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe("Payment Update Integration Test", () => {
  it("should identify the 404 issue with payment ID 9", async () => {
    const queryClient = createTestQueryClient();

    // First, let's see what happens when we try to fetch all payments
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            paymentId: 1,
            accountNameOwner: "test_account",
            sourceAccount: "checking_account",
            destinationAccount: "savings_account",
            transactionDate: "2024-08-01",
            amount: 100.0,
            activeStatus: true,
          },
          {
            paymentId: 2,
            accountNameOwner: "test_account",
            sourceAccount: "checking_account",
            destinationAccount: "credit_card",
            transactionDate: "2024-08-02",
            amount: 50.0,
            activeStatus: true,
          },
        ]),
        { status: 200 },
      ),
    );

    const { result: fetchResult } = renderHook(() => usePaymentFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(fetchResult.current.isSuccess).toBe(true));

    const payments = fetchResult.current.data || [];

    // Test updating a payment that exists (ID 1)
    const existingPayment: Payment = {
      paymentId: 1,
      accountNameOwner: "test_account",
      sourceAccount: "checking_account",
      destinationAccount: "savings_account",
      transactionDate: new Date("2024-08-01"),
      amount: 100.0,
      activeStatus: true,
    };

    const updatedPayment: Payment = {
      ...existingPayment,
      amount: 150.0,
    };

    // Mock successful update for existing payment
    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(updatedPayment), { status: 200 }),
      );

    const { result: updateResult } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    updateResult.current.mutate({
      oldPayment: existingPayment,
      newPayment: updatedPayment,
    });

    await waitFor(() => expect(updateResult.current.isSuccess).toBe(true));

    // Now test updating a payment that doesn't exist (ID 9)
    const nonExistentPayment: Payment = {
      paymentId: 9,
      accountNameOwner: "test_account",
      sourceAccount: "checking_account",
      destinationAccount: "savings_account",
      transactionDate: new Date("2024-08-01"),
      amount: 100.0,
      activeStatus: true,
    };

    const updatedNonExistentPayment: Payment = {
      ...nonExistentPayment,
      amount: 200.0,
    };

    // Mock 404 response for non-existent payment
    global.fetch = createModernErrorFetchMock("Payment not found", 404);

    const { result: updateNonExistentResult } = renderHook(
      () => usePaymentUpdate(),
      {
        wrapper: createWrapper(queryClient),
      },
    );

    await expect(
      updateNonExistentResult.current.mutateAsync({
        oldPayment: nonExistentPayment,
        newPayment: updatedNonExistentPayment,
      }),
    ).rejects.toThrow("Payment not found");
  });
});
