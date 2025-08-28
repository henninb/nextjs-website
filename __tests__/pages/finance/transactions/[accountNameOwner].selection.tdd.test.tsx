import React from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "../../../../contexts/UIContext";

let capturedProps: any = null;

// Mock DataGridBase to capture props
jest.doMock("../../../../components/DataGridBase", () => ({
  __esModule: true,
  default: (props: any) => {
    capturedProps = props;
    return <div data-testid="grid-capture" />;
  },
}));

// Reuse/align core mocks similar to the main transactions test
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { accountNameOwner: "Test Account" },
    replace: jest.fn(),
  }),
}));

jest.mock("../../../../hooks/useTransactionByAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: [
      {
        transactionId: 1,
        accountNameOwner: "Test Account",
        transactionDate: new Date("2024-01-01"),
        description: "Test Transaction",
        category: "Food",
        amount: -50.0,
        cleared: 0,
        transactionState: "outstanding",
        transactionType: "expense",
        reoccurringType: "none",
        activeStatus: true,
      },
    ],
    isSuccess: true,
    isFetching: false,
    error: null,
  })),
}));

jest.mock("../../../../hooks/useTotalsPerAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: {
      totals: 0,
      totalsCleared: 0,
      totalsOutstanding: 0,
      totalsFuture: 0,
    },
    isSuccess: true,
    isFetching: false,
    error: null,
  })),
}));

jest.mock("../../../../hooks/useValidationAmountFetch", () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: null, isSuccess: true, isFetching: false })),
}));

jest.mock("../../../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: [
      {
        accountId: 1,
        accountNameOwner: "Test Account",
        accountType: "debit",
        moniker: "TEST",
      },
    ],
    isSuccess: true,
    isFetching: false,
    error: null,
  })),
}));

jest.mock("../../../../hooks/useCategoryFetch", () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: [], isSuccess: true, isFetching: false })),
}));

jest.mock("../../../../hooks/useDescriptionFetch", () => ({
  __esModule: true,
  default: jest.fn(() => ({ data: [], isSuccess: true, isFetching: false })),
}));

jest.mock("../../../../hooks/useTransactionUpdate", () => ({
  __esModule: true,
  default: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));
jest.mock("../../../../hooks/useTransactionInsert", () => ({
  __esModule: true,
  default: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));
jest.mock("../../../../hooks/useTransactionDelete", () => ({
  __esModule: true,
  default: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));
jest.mock("../../../../hooks/useValidationAmountInsert", () => ({
  __esModule: true,
  default: jest.fn(() => ({ mutateAsync: jest.fn() })),
}));

jest.mock("../../../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({ isAuthenticated: true, loading: false })),
}));

const createWrapper = () => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={qc}>
      <UIProvider>{children}</UIProvider>
    </QueryClientProvider>
  );
};

describe("Transactions page selection model (TDD)", () => {
  it("passes an array-based rowSelectionModel to DataGridBase", async () => {
    const Page = (
      await import("../../../../pages/finance/transactions/[accountNameOwner]")
    ).default;
    render(<Page />, { wrapper: createWrapper() });

    expect(Array.isArray(capturedProps?.rowSelectionModel)).toBe(true);
  });
});
