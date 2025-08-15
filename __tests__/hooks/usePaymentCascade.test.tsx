import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
import Payment from "../../model/Payment";
import Transaction from "../../model/Transaction";

// This is a TDD test describing desired behavior that does not exist yet.
// When a payment is updated (amount or date), the corresponding transactions
// in the source and destination accounts should be updated as well.

// Mock next/router to keep tests isolated
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

describe("usePaymentUpdate cascade behavior (TDD)", () => {
  it("updates linked transactions in source and destination accounts when a payment changes", async () => {
    const queryClient = createTestQueryClient();

    // Arrange: existing transactions for each account, one linked to paymentId
    const sourceAccount = "checking_brian";
    const destinationAccount = "credit_card_brian";
    const paymentId = 9991;

    const initialSourceTxns: Transaction[] = [
      {
        guid: "src-guid-linked",
        accountType: "debit",
        accountNameOwner: sourceAccount,
        transactionDate: new Date("2024-08-01"),
        description: "Credit card payment",
        category: "payments",
        amount: -100.0,
        transactionState: "cleared",
        transactionType: "expense",
        activeStatus: true,
        reoccurringType: "onetime",
        notes: `paymentId:${paymentId}`,
      },
      {
        guid: "src-guid-other",
        accountType: "debit",
        accountNameOwner: sourceAccount,
        transactionDate: new Date("2024-08-02"),
        description: "Groceries",
        category: "food",
        amount: -50.0,
        transactionState: "cleared",
        transactionType: "expense",
        activeStatus: true,
        reoccurringType: "onetime",
        notes: "",
      },
    ];

    const initialDestTxns: Transaction[] = [
      {
        guid: "dst-guid-linked",
        accountType: "credit",
        accountNameOwner: destinationAccount,
        transactionDate: new Date("2024-08-01"),
        description: "Payment received",
        category: "payments",
        amount: 100.0,
        transactionState: "cleared",
        transactionType: "payment",
        activeStatus: true,
        reoccurringType: "onetime",
        notes: `paymentId:${paymentId}`,
      },
      {
        guid: "dst-guid-other",
        accountType: "credit",
        accountNameOwner: destinationAccount,
        transactionDate: new Date("2024-08-03"),
        description: "Online purchase",
        category: "online",
        amount: 25.0,
        transactionState: "outstanding",
        transactionType: "expense",
        activeStatus: true,
        reoccurringType: "onetime",
        notes: "",
      },
    ];

    // Seed React Query caches for transaction-by-account
    queryClient.setQueryData(["accounts", sourceAccount], initialSourceTxns);
    queryClient.setQueryData(
      ["accounts", destinationAccount],
      initialDestTxns,
    );

    // Prepare old/new payment values (user edits amount and date)
    const oldPayment: Payment = {
      paymentId,
      accountNameOwner: destinationAccount,
      sourceAccount,
      destinationAccount,
      transactionDate: new Date("2024-08-01"),
      amount: 100.0,
      activeStatus: true,
    };

    const newPayment: Payment = {
      ...oldPayment,
      transactionDate: new Date("2024-08-10"),
      amount: 150.0,
    };

    // Mock network response for the payment update call
    const responsePayment = {
      ...newPayment,
      // some backends may return strings for dates; it doesn't matter for this test
      transactionDate: newPayment.transactionDate.toString(),
      dateUpdated: new Date().toISOString(),
    } as unknown as Payment;

    global.fetch = jest
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify(responsePayment), { status: 200 }),
      );

    // Act
    const { result } = renderHook(() => usePaymentUpdate(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate({ oldPayment, newPayment });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Assert (desired behavior):
    // - The linked transactions (notes contain paymentId) in BOTH accounts should reflect the new date/amount.
    // - Unrelated transactions should remain unchanged.
    const updatedSource = queryClient.getQueryData<Transaction[]>([
      "accounts",
      sourceAccount,
    ]);
    const updatedDest = queryClient.getQueryData<Transaction[]>([
      "accounts",
      destinationAccount,
    ]);

    expect(updatedSource).toBeDefined();
    expect(updatedDest).toBeDefined();

    const srcLinked = updatedSource?.find((t) => t.guid === "src-guid-linked");
    const srcOther = updatedSource?.find((t) => t.guid === "src-guid-other");
    const dstLinked = updatedDest?.find((t) => t.guid === "dst-guid-linked");
    const dstOther = updatedDest?.find((t) => t.guid === "dst-guid-other");

    // These expectations describe the feature we want (they will fail today)
    expect(srcLinked?.amount).toBe(-150.0); // source outflow should track new amount
    expect(new Date(srcLinked?.transactionDate as any).toDateString()).toBe(
      newPayment.transactionDate.toDateString(),
    );

    expect(dstLinked?.amount).toBe(150.0); // destination inflow should track new amount
    expect(new Date(dstLinked?.transactionDate as any).toDateString()).toBe(
      newPayment.transactionDate.toDateString(),
    );

    // Unrelated transactions should remain unchanged
    expect(srcOther).toEqual(initialSourceTxns[1]);
    expect(dstOther).toEqual(initialDestTxns[1]);
  });
});

