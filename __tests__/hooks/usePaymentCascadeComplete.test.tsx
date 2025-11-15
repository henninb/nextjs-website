import React from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import usePaymentUpdate from "../../hooks/usePaymentUpdate";
import Payment from "../../model/Payment";
import Transaction from "../../model/Transaction";

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

const { __mockLogger: mockLogger } = jest.requireMock(
  "../../utils/logger",
) as { __mockLogger: ReturnType<typeof createMockLogger> };

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

describe("Payment Update Cascade Functionality", () => {
  describe("when payment amount and date are updated", () => {
    it("should cascade changes to linked transactions in both source and destination accounts", async () => {
      const queryClient = createTestQueryClient();

      const sourceAccount = "checking_john";
      const destinationAccount = "savings_john";
      const paymentId = 12345;

      const initialSourceTransactions: Transaction[] = [
        {
          guid: "source-linked-txn",
          accountType: "debit",
          accountNameOwner: sourceAccount,
          transactionDate: new Date("2024-08-01"),
          description: "Transfer to savings",
          category: "transfer",
          amount: -200.0,
          transactionState: "cleared",
          transactionType: "expense",
          activeStatus: true,
          reoccurringType: "onetime",
          notes: `paymentId:${paymentId}`,
        },
        {
          guid: "source-unlinked-txn",
          accountType: "debit",
          accountNameOwner: sourceAccount,
          transactionDate: new Date("2024-08-02"),
          description: "Gas station",
          category: "transportation",
          amount: -40.0,
          transactionState: "cleared",
          transactionType: "expense",
          activeStatus: true,
          reoccurringType: "onetime",
          notes: "Regular gas purchase",
        },
      ];

      const initialDestTransactions: Transaction[] = [
        {
          guid: "dest-linked-txn",
          accountType: "debit",
          accountNameOwner: destinationAccount,
          transactionDate: new Date("2024-08-01"),
          description: "Transfer from checking",
          category: "transfer",
          amount: 200.0,
          transactionState: "cleared",
          transactionType: "payment",
          activeStatus: true,
          reoccurringType: "onetime",
          notes: `paymentId:${paymentId}`,
        },
        {
          guid: "dest-unlinked-txn",
          accountType: "debit",
          accountNameOwner: destinationAccount,
          transactionDate: new Date("2024-08-03"),
          description: "Interest earned",
          category: "income",
          amount: 5.0,
          transactionState: "cleared",
          transactionType: "income",
          activeStatus: true,
          reoccurringType: "onetime",
          notes: "Monthly interest",
        },
      ];

      queryClient.setQueryData(
        ["accounts", sourceAccount],
        initialSourceTransactions,
      );
      queryClient.setQueryData(
        ["accounts", destinationAccount],
        initialDestTransactions,
      );

      const originalPayment: Payment = {
        paymentId,
        accountNameOwner: destinationAccount,
        sourceAccount,
        destinationAccount,
        transactionDate: new Date("2024-08-01"),
        amount: 200.0,
        activeStatus: true,
      };

      const updatedPayment: Payment = {
        ...originalPayment,
        transactionDate: new Date("2024-08-15"),
        amount: 300.0,
      };

      global.fetch = jest.fn().mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ...updatedPayment,
            transactionDate: updatedPayment.transactionDate.toISOString(),
          }),
          { status: 200 },
        ),
      );

      const { result } = renderHook(() => usePaymentUpdate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        oldPayment: originalPayment,
        newPayment: updatedPayment,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const updatedSourceTransactions = queryClient.getQueryData<Transaction[]>(
        ["accounts", sourceAccount],
      );
      const updatedDestTransactions = queryClient.getQueryData<Transaction[]>([
        "accounts",
        destinationAccount,
      ]);

      expect(updatedSourceTransactions).toBeDefined();
      expect(updatedDestTransactions).toBeDefined();

      const sourceLinkedTransaction = updatedSourceTransactions?.find(
        (t) => t.guid === "source-linked-txn",
      );
      const sourceUnlinkedTransaction = updatedSourceTransactions?.find(
        (t) => t.guid === "source-unlinked-txn",
      );
      const destLinkedTransaction = updatedDestTransactions?.find(
        (t) => t.guid === "dest-linked-txn",
      );
      const destUnlinkedTransaction = updatedDestTransactions?.find(
        (t) => t.guid === "dest-unlinked-txn",
      );

      expect(sourceLinkedTransaction?.amount).toBe(-300.0);
      expect(
        new Date(
          sourceLinkedTransaction?.transactionDate as any,
        ).toDateString(),
      ).toBe(updatedPayment.transactionDate.toDateString());

      expect(destLinkedTransaction?.amount).toBe(300.0);
      expect(
        new Date(destLinkedTransaction?.transactionDate as any).toDateString(),
      ).toBe(updatedPayment.transactionDate.toDateString());

      expect(sourceUnlinkedTransaction).toEqual(initialSourceTransactions[1]);
      expect(destUnlinkedTransaction).toEqual(initialDestTransactions[1]);
    });

    it("should handle case where linked transactions don't exist", async () => {
      const queryClient = createTestQueryClient();

      const sourceAccount = "checking_empty";
      const destinationAccount = "savings_empty";
      const paymentId = 99999;

      queryClient.setQueryData(["accounts", sourceAccount], []);
      queryClient.setQueryData(["accounts", destinationAccount], []);

      const originalPayment: Payment = {
        paymentId,
        accountNameOwner: destinationAccount,
        sourceAccount,
        destinationAccount,
        transactionDate: new Date("2024-08-01"),
        amount: 100.0,
        activeStatus: true,
      };

      const updatedPayment: Payment = {
        ...originalPayment,
        amount: 150.0,
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(updatedPayment), { status: 200 }),
        );

      const { result } = renderHook(() => usePaymentUpdate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        oldPayment: originalPayment,
        newPayment: updatedPayment,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const updatedSourceTransactions = queryClient.getQueryData<Transaction[]>(
        ["accounts", sourceAccount],
      );
      const updatedDestTransactions = queryClient.getQueryData<Transaction[]>([
        "accounts",
        destinationAccount,
      ]);

      expect(updatedSourceTransactions).toEqual([]);
      expect(updatedDestTransactions).toEqual([]);
    });

    it("should only update transactions with matching paymentId in notes", async () => {
      const queryClient = createTestQueryClient();

      const sourceAccount = "checking_multi";
      const paymentId1 = 1001;
      const paymentId2 = 1002;

      const sourceTransactions: Transaction[] = [
        {
          guid: "txn-payment1",
          accountType: "debit",
          accountNameOwner: sourceAccount,
          transactionDate: new Date("2024-08-01"),
          description: "Payment 1",
          category: "transfer",
          amount: -100.0,
          transactionState: "cleared",
          transactionType: "expense",
          activeStatus: true,
          reoccurringType: "onetime",
          notes: `paymentId:${paymentId1}`,
        },
        {
          guid: "txn-payment2",
          accountType: "debit",
          accountNameOwner: sourceAccount,
          transactionDate: new Date("2024-08-01"),
          description: "Payment 2",
          category: "transfer",
          amount: -50.0,
          transactionState: "cleared",
          transactionType: "expense",
          activeStatus: true,
          reoccurringType: "onetime",
          notes: `paymentId:${paymentId2}`,
        },
      ];

      queryClient.setQueryData(["accounts", sourceAccount], sourceTransactions);

      const originalPayment: Payment = {
        paymentId: paymentId1,
        accountNameOwner: "dest_account",
        sourceAccount,
        destinationAccount: "dest_account",
        transactionDate: new Date("2024-08-01"),
        amount: 100.0,
        activeStatus: true,
      };

      const updatedPayment: Payment = {
        ...originalPayment,
        amount: 150.0,
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(updatedPayment), { status: 200 }),
        );

      const { result } = renderHook(() => usePaymentUpdate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        oldPayment: originalPayment,
        newPayment: updatedPayment,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const updatedTransactions = queryClient.getQueryData<Transaction[]>([
        "accounts",
        sourceAccount,
      ]);

      const payment1Txn = updatedTransactions?.find(
        (t) => t.guid === "txn-payment1",
      );
      const payment2Txn = updatedTransactions?.find(
        (t) => t.guid === "txn-payment2",
      );

      expect(payment1Txn?.amount).toBe(-150.0);
      expect(payment2Txn?.amount).toBe(-50.0);
    });
  });

  describe("cascade error handling", () => {
    it("should continue payment update even if cascade fails", async () => {
      const queryClient = createTestQueryClient();

      const mockGetQueryData = jest.fn().mockImplementation((key) => {
        if (key[0] === "accounts") {
          throw new Error("Cascade failure");
        }
        return [];
      });

      queryClient.getQueryData = mockGetQueryData;

      const originalPayment: Payment = {
        paymentId: 123,
        accountNameOwner: "test_account",
        sourceAccount: "source",
        destinationAccount: "dest",
        transactionDate: new Date("2024-08-01"),
        amount: 100.0,
        activeStatus: true,
      };

      const updatedPayment: Payment = {
        ...originalPayment,
        amount: 150.0,
      };

      global.fetch = jest
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(updatedPayment), { status: 200 }),
        );

      const { result } = renderHook(() => usePaymentUpdate(), {
        wrapper: createWrapper(queryClient),
      });

      result.current.mutate({
        oldPayment: originalPayment,
        newPayment: updatedPayment,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "Payment cascade to transactions failed (non-fatal)",
        expect.any(Error),
      );
    });
  });
});
