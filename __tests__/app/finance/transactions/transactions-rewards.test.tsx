import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "../../../../contexts/UIContext";
import AccountTransactions from "../../../../app/finance/transactions/[accountNameOwner]/page";
import * as useTransactionByAccountFetchPaged from "../../../../hooks/useTransactionByAccountFetchPaged";
import * as useTotalsPerAccountFetch from "../../../../hooks/useTotalsPerAccountFetch";
import * as useValidationAmountFetch from "../../../../hooks/useValidationAmountFetch";
import * as useAccountFetch from "../../../../hooks/useAccountFetch";
import * as useCategoryFetch from "../../../../hooks/useCategoryFetch";
import * as useDescriptionFetch from "../../../../hooks/useDescriptionFetch";
import * as AuthProvider from "../../../../components/AuthProvider";

const originalReactUse = React.use;
React.use = jest.fn((promise: any) => {
  if (promise instanceof Promise) return originalReactUse(promise);
  return promise;
}) as any;

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn(), pathname: "/" }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => "/finance/transactions/amex_brian",
}));

jest.mock("../../../../hooks/useTransactionByAccountFetchPaged");
jest.mock("../../../../hooks/useTotalsPerAccountFetch");
jest.mock("../../../../hooks/useValidationAmountFetch");
jest.mock("../../../../hooks/useAccountFetch");
jest.mock("../../../../hooks/useCategoryFetch");
jest.mock("../../../../hooks/useDescriptionFetch");
jest.mock("../../../../hooks/useTransactionUpdate");
jest.mock("../../../../hooks/useTransactionInsert");
jest.mock("../../../../hooks/useTransactionDelete");
jest.mock("../../../../hooks/useValidationAmountInsert");
jest.mock("../../../../hooks/useParameterFetch");
jest.mock("../../../../hooks/useAccountUsageTracking", () => ({
  __esModule: true,
  default: () => ({ trackAccountVisit: jest.fn() }),
}));
jest.mock("../../../../components/AuthProvider");
jest.mock("../../../../components/USDAmountInput", () => ({
  __esModule: true,
  default: ({ value, onChange, label, fullWidth, margin, error, helperText, ...props }: any) => (
    <input value={value} onChange={(e) => onChange(e.target.value)} aria-label={label || "Amount ($)"} {...props} />
  ),
}));
jest.mock("../../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title }: any) => <div data-testid="empty-state">{title}</div>,
}));
jest.mock("../../../../components/LoadingState", () => ({
  __esModule: true,
  default: () => <div role="progressbar" aria-label="loading" />,
}));
jest.mock("../../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error }: any) => <div>Error: {error?.message}</div>,
}));
jest.mock("../../../../components/StatCard", () => ({
  __esModule: true,
  default: ({ label, value }: any) => (
    <div data-testid="stat-card">
      <div>{label}</div>
      <div>{value}</div>
    </div>
  ),
}));
jest.mock("../../../../components/StatCardSkeleton", () => ({
  __esModule: true,
  default: () => <div data-testid="stat-card-skeleton" />,
}));
jest.mock("../../../../components/ConfirmDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/FormDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/PasteTransactionsDialog", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/ReceiptLightbox", () => ({
  __esModule: true,
  default: () => null,
  buildImageSrc: jest.fn(),
}));
jest.mock("../../../../components/SpendingBonusTracker", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/TransactionFilterBar", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/TransactionCard", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/TransactionCardSkeleton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/ViewToggle", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/PageHeader", () => ({
  __esModule: true,
  default: ({ title }: any) => <h1>{title}</h1>,
}));
jest.mock("../../../../components/AICategoryBadge", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("../../../../components/DataGridBase", () => ({
  __esModule: true,
  default: ({ rows, columns, getRowId }: any) => (
    <div data-testid="data-grid">
      {rows?.map((row: any, rowIndex: number) => (
        <div key={rowIndex} data-testid={`row-${rowIndex}`}>
          {columns?.map((col: any, colIndex: number) => (
            <div key={colIndex} data-testid={`cell-${rowIndex}-${col.field}`}>
              {col.renderCell
                ? col.renderCell({ row, value: row[col.field] })
                : row[col.field]}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}));

import * as useTransactionUpdate from "../../../../hooks/useTransactionUpdate";
import * as useTransactionInsert from "../../../../hooks/useTransactionInsert";
import * as useTransactionDelete from "../../../../hooks/useTransactionDelete";
import * as useValidationAmountInsert from "../../../../hooks/useValidationAmountInsert";
import * as useParameterFetch from "../../../../hooks/useParameterFetch";

const mockAccount = {
  accountId: 1,
  accountNameOwner: "amex_brian",
  accountType: "credit",
  moniker: "AMEX",
};

const baseMocks = () => {
  (AuthProvider.useAuth as jest.Mock).mockReturnValue({
    isAuthenticated: true,
    loading: false,
  });
  (useTotalsPerAccountFetch.default as jest.Mock).mockReturnValue({
    data: { totals: 0, totalsCleared: 0, totalsOutstanding: 0, totalsFuture: 0 },
    isSuccess: true,
    isLoading: false,
    error: null,
  });
  (useValidationAmountFetch.default as jest.Mock).mockReturnValue({
    data: null,
    isSuccess: true,
    isLoading: false,
    error: null,
  });
  (useAccountFetch.default as jest.Mock).mockReturnValue({
    data: [mockAccount],
    isSuccess: true,
    isLoading: false,
    error: null,
  });
  (useCategoryFetch.default as jest.Mock).mockReturnValue({
    data: [],
    isSuccess: true,
    isLoading: false,
    error: null,
  });
  (useDescriptionFetch.default as jest.Mock).mockReturnValue({
    data: [],
    isSuccess: true,
    isLoading: false,
    error: null,
  });
  (useTransactionUpdate.default as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
  (useTransactionInsert.default as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
  (useTransactionDelete.default as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
  (useValidationAmountInsert.default as jest.Mock).mockReturnValue({ mutateAsync: jest.fn() });
  (useParameterFetch.default as jest.Mock).mockReturnValue({
    data: [],
    isSuccess: true,
    isLoading: false,
    error: null,
  });
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <UIProvider>
        <React.Suspense fallback={<div>Loading...</div>}>{children}</React.Suspense>
      </UIProvider>
    </QueryClientProvider>
  );
};

const renderPage = () =>
  render(
    <AccountTransactions params={{ accountNameOwner: "amex_brian" } as any} />,
    { wrapper: createWrapper() },
  );

describe("Rewards column behavior", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    baseMocks();
  });

  it("hides the rewards column when all transactions have cashback null", async () => {
    (useTransactionByAccountFetchPaged.default as jest.Mock).mockReturnValue({
      data: {
        content: [
          {
            transactionId: 1,
            accountNameOwner: "amex_brian",
            transactionDate: new Date("2024-01-01"),
            description: "Payment",
            category: "payment",
            amount: -100,
            transactionState: "cleared",
            transactionType: "expense",
            reoccurringType: "onetime",
            activeStatus: true,
            cashback: null,
          },
        ],
        totalElements: 1,
      },
      isSuccess: true,
      isLoading: false,
      error: null,
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId("data-grid")).toBeInTheDocument());
    expect(screen.queryByTestId("cell-0-cashback")).not.toBeInTheDocument();
  });

  it("shows the rewards column when at least one transaction has cashback set", async () => {
    (useTransactionByAccountFetchPaged.default as jest.Mock).mockReturnValue({
      data: {
        content: [
          {
            transactionId: 1,
            accountNameOwner: "amex_brian",
            transactionDate: new Date("2024-01-01"),
            description: "Whole Foods",
            category: "groceries",
            amount: -100,
            transactionState: "cleared",
            transactionType: "expense",
            reoccurringType: "onetime",
            activeStatus: true,
            cashback: 6.0,
          },
        ],
        totalElements: 1,
      },
      isSuccess: true,
      isLoading: false,
      error: null,
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId("cell-0-cashback")).toBeInTheDocument());
    expect(screen.getByTestId("cell-0-cashback")).toHaveTextContent("$6.00");
  });

  it("renders — for a transaction with cashback null alongside others that have it", async () => {
    (useTransactionByAccountFetchPaged.default as jest.Mock).mockReturnValue({
      data: {
        content: [
          {
            transactionId: 1,
            accountNameOwner: "amex_brian",
            transactionDate: new Date("2024-01-01"),
            description: "Whole Foods",
            category: "groceries",
            amount: -100,
            transactionState: "cleared",
            transactionType: "expense",
            reoccurringType: "onetime",
            activeStatus: true,
            cashback: 6.0,
          },
          {
            transactionId: 2,
            accountNameOwner: "amex_brian",
            transactionDate: new Date("2024-01-02"),
            description: "Payment",
            category: "payment",
            amount: -500,
            transactionState: "cleared",
            transactionType: "expense",
            reoccurringType: "onetime",
            activeStatus: true,
            cashback: null,
          },
        ],
        totalElements: 2,
      },
      isSuccess: true,
      isLoading: false,
      error: null,
    });

    renderPage();

    await waitFor(() => expect(screen.getByTestId("cell-0-cashback")).toBeInTheDocument());
    expect(screen.getByTestId("cell-0-cashback")).toHaveTextContent("$6.00");
    expect(screen.getByTestId("cell-1-cashback")).toHaveTextContent("—");
  });
});
