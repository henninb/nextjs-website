import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
import usePaymentFetch from "../../hooks/usePaymentFetch";
import Payment from "../../model/Payment";

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
    global.fetch = jest.fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([
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
          }
        ]), { status: 200 })
      );

    const { result: fetchResult } = renderHook(() => usePaymentFetch(), {
      wrapper: createWrapper(queryClient),
    });

    await waitFor(() => expect(fetchResult.current.isSuccess).toBe(true));
    
    const payments = fetchResult.current.data || [];
    console.log("Available payments:", payments.map(p => ({ id: p.paymentId, amount: p.amount })));

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
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response(JSON.stringify(updatedPayment), { status: 200 })
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
    global.fetch = jest.fn().mockResolvedValueOnce(
      new Response("Payment not found", { status: 404 })
    );

    const { result: updateNonExistentResult } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    updateNonExistentResult.current.mutate({
      oldPayment: nonExistentPayment,
      newPayment: updatedNonExistentPayment,
    });

    // The hook should handle 404 gracefully and return the new payment as fallback
    await waitFor(() => expect(updateNonExistentResult.current.isSuccess).toBe(true));
    
    // According to the implementation, it should return the newPayment as fallback for 404
    expect(updateNonExistentResult.current.data).toEqual(updatedNonExistentPayment);
  });

  it("should suggest checking if payment ID exists in the database", () => {
    console.log("\n=== DEBUGGING PAYMENT UPDATE 404 ===");
    console.log("1. Check if payment ID 9 exists in your database");
    console.log("2. Verify the backend API endpoint: PUT /api/payment/update/{id}");
    console.log("3. Check backend logs for more detailed error info");
    console.log("4. Confirm the payment table has the correct schema");
    console.log("5. Test with a known existing payment ID first");
    console.log("=====================================\n");
  });
});