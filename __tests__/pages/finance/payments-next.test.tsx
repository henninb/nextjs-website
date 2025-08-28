import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock MUI DataGrid to render simple DOM for interactions
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any, rIdx: number) => (
        <div key={rIdx}>
          {columns.map((col: any, cIdx: number) =>
            col.renderCell ? (
              <div
                key={cIdx}
                data-testid={`cell-${rIdx}-${String(
                  col.headerName || col.field,
                ).toLowerCase()}`}
              >
                {col.renderCell({ row, value: row[col.field] })}
              </div>
            ) : null,
          )}
        </div>
      ))}
    </div>
  ),
}));

// Module paths
import * as AuthProvider from "../../../components/AuthProvider";
import PaymentsNextGen from "../../../pages/finance/payments-next";
import * as useAccountFetchGql from "../../../hooks/useAccountFetchGql";
import * as usePaymentFetchGql from "../../../hooks/usePaymentFetchGql";
import * as usePaymentInsertGql from "../../../hooks/usePaymentInsertGql";
import * as usePaymentDeleteGql from "../../../hooks/usePaymentDeleteGql";
import * as usePaymentUpdateGql from "../../../hooks/usePaymentUpdateGql";

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock form helpers for stable testing
jest.mock("../../../components/USDAmountInput", () => {
  return function MockUSDAmountInput({ value, onChange, label }: any) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || "Amount"}
      />
    );
  };
});

// Mock EmptyState and ErrorDisplay
jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && (
        <button onClick={onAction} data-testid="empty-action">
          Add Payment
        </button>
      )}
      {onRefresh && (
        <button onClick={onRefresh} data-testid="empty-refresh">
          Refresh
        </button>
      )}
    </div>
  ),
}));

jest.mock("../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="error-display">
      <div>An unexpected error occurred. Please try again.</div>
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Try Again
        </button>
      )}
    </div>
  ),
}));

jest.mock("../../../hooks/useAccountFetchGql");
jest.mock("../../../hooks/usePaymentFetchGql");
jest.mock("../../../hooks/usePaymentInsertGql");
jest.mock("../../../hooks/usePaymentDeleteGql");
jest.mock("../../../hooks/usePaymentUpdateGql");
jest.mock("../../../components/AuthProvider");

const mockPayments = [
  {
    paymentId: 1,
    transactionDate: new Date("2024-01-15"),
    sourceAccount: "Checking Account",
    destinationAccount: "Credit Card",
    amount: 250.5,
    activeStatus: true,
  },
];

const mockAccounts = [
  {
    accountId: 1,
    accountNameOwner: "Checking Account",
    accountType: "debit",
    moniker: "CHK",
    activeStatus: true,
    outstanding: 0,
    future: 0,
    cleared: 0,
  },
  {
    accountId: 2,
    accountNameOwner: "Credit Card",
    accountType: "credit",
    moniker: "CC",
    activeStatus: true,
    outstanding: 0,
    future: 0,
    cleared: 0,
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("PaymentsNextGen page", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (usePaymentFetchGql.default as jest.Mock).mockReturnValue({
      data: mockPayments,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    (useAccountFetchGql.default as jest.Mock).mockReturnValue({
      data: mockAccounts,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    (usePaymentInsertGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (usePaymentDeleteGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ ok: true }),
    });

    (usePaymentUpdateGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders the page header", () => {
    render(<PaymentsNextGen />, { wrapper: createWrapper() });
    expect(screen.getByText(/Payment Management/i)).toBeInTheDocument();
    expect(
      screen.getByText(/GraphQL-powered payments between accounts/i),
    ).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (usePaymentFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsNextGen />, { wrapper: createWrapper() });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading payments and accounts..."),
    ).toBeInTheDocument();
  });

  it("renders empty state when there are no payments", () => {
    (usePaymentFetchGql.default as jest.Mock).mockReturnValue({
      data: [],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsNextGen />, { wrapper: createWrapper() });
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No Payments Found/i)).toBeInTheDocument();
  });

  it("renders grid with formatted values and account links", () => {
    render(<PaymentsNextGen />, { wrapper: createWrapper() });

    // Currency formatting
    expect(screen.getByText("$250.50")).toBeInTheDocument();

    // Account links
    const sourceLink = screen.getByText("Checking Account").closest("a");
    const destinationLink = screen.getByText("Credit Card").closest("a");
    expect(sourceLink).toHaveAttribute(
      "href",
      "/finance/transactions/Checking Account",
    );
    expect(destinationLink).toHaveAttribute(
      "href",
      "/finance/transactions/Credit Card",
    );
  });

  it("shows ErrorDisplay and triggers refetch on retry", () => {
    const refetchPayments = jest.fn();
    const refetchAccounts = jest.fn();

    (usePaymentFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom payments"),
      refetch: refetchPayments,
    });
    (useAccountFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom accounts"),
      refetch: refetchAccounts,
    });

    render(<PaymentsNextGen />, { wrapper: createWrapper() });
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("retry-button"));
    expect(refetchPayments).toHaveBeenCalledTimes(1);
  });

  it("opens Add Payment dialog and submits insert mutation", () => {
    const mockInsert = jest.fn().mockResolvedValue({});
    (usePaymentInsertGql.default as jest.Mock).mockReturnValue({
      mutateAsync: mockInsert,
    });

    render(<PaymentsNextGen />, { wrapper: createWrapper() });

    // Click the page-level Add Payment button
    const addButtons = screen.getAllByText("Add Payment");
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    // Set an amount in the mocked input to exercise submit
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: "100" } });

    // Submit dialog (button label can be "Add Payment" or "Pay $100.00")
    const submitButtons = screen.getAllByRole("button");
    const submit = submitButtons.find((b) =>
      /Add Payment|Pay \$/.test(b.textContent || ""),
    );
    if (!submit) throw new Error("Submit button not found");
    fireEvent.click(submit);

    expect(mockInsert).toHaveBeenCalled();
  });
});
