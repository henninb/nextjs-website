import React from "react";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock MUI DataGrid to render cells and expose simple DOM for interactions
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any, rIdx: number) => (
        <div key={rIdx}>
          {columns.map((col: any, cIdx: number) =>
            col.renderCell ? (
              <div
                key={cIdx}
                data-testid={`cell-${rIdx}-${String(col.headerName || col.field).toLowerCase()}`}
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
import TransfersNextGen from "../../../pages/finance/transfers-next";
import * as useAccountFetchGql from "../../../hooks/useAccountFetchGql";
import * as useTransferFetchGql from "../../../hooks/useTransferFetchGql";
import * as useTransferInsertGql from "../../../hooks/useTransferInsertGql";
import * as useTransferDeleteGql from "../../../hooks/useTransferDeleteGql";
import * as useTransferUpdateGql from "../../../hooks/useTransferUpdateGql";

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock form helpers for stable testing
jest.mock("../../../components/USDAmountInput", () => {
  return function MockUSDAmountInput({
    value,
    onChange,
    label,
    ...props
  }: any) {
    return (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || "Amount"}
        {...props}
      />
    );
  };
});

// Mock EmptyState and ErrorDisplay for deterministic output
jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && (
        <button onClick={onAction} data-testid="empty-action">
          Add Transfer
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
jest.mock("../../../hooks/useTransferFetchGql");
jest.mock("../../../hooks/useTransferInsertGql");
jest.mock("../../../hooks/useTransferDeleteGql");
jest.mock("../../../hooks/useTransferUpdateGql");
jest.mock("../../../components/AuthProvider");

const mockTransfers = [
  {
    transferId: 1,
    transactionDate: new Date("2024-01-01"),
    sourceAccount: "Checking Account",
    destinationAccount: "Savings Account",
    amount: 500.0,
    guidSource: "guid-1",
    guidDestination: "guid-2",
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
    accountNameOwner: "Savings Account",
    accountType: "debit",
    moniker: "SAV",
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

describe("TransfersNextGen page", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useTransferFetchGql.default as jest.Mock).mockReturnValue({
      data: mockTransfers,
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

    (useTransferInsertGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransferDeleteGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ ok: true }),
    });

    (useTransferUpdateGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders the page header", () => {
    render(<TransfersNextGen />, { wrapper: createWrapper() });
    expect(screen.getByText(/Transfer Management/i)).toBeInTheDocument();
    expect(
      screen.getByText(/GraphQL-powered transfers between accounts/i),
    ).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useTransferFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<TransfersNextGen />, { wrapper: createWrapper() });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading transfers and accounts..."),
    ).toBeInTheDocument();
  });

  it("renders empty state when there are no transfers", () => {
    (useTransferFetchGql.default as jest.Mock).mockReturnValue({
      data: [],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<TransfersNextGen />, { wrapper: createWrapper() });
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No Transfers Found/i)).toBeInTheDocument();
  });

  it("renders grid with formatted values and account links", () => {
    render(<TransfersNextGen />, { wrapper: createWrapper() });

    // Currency formatting
    expect(screen.getByText("$500.00")).toBeInTheDocument();

    // Account links
    const sourceLink = screen.getByText("Checking Account").closest("a");
    const destinationLink = screen.getByText("Savings Account").closest("a");
    expect(sourceLink).toHaveAttribute(
      "href",
      "/finance/transactions/Checking Account",
    );
    expect(destinationLink).toHaveAttribute(
      "href",
      "/finance/transactions/Savings Account",
    );
  });

  // Removed flaky delete-confirmation mutation test at user request.

  it("shows ErrorDisplay and triggers refetch on retry", () => {
    const refetchTransfers = jest.fn();
    const refetchAccounts = jest.fn();

    (useTransferFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom transfers"),
      refetch: refetchTransfers,
    });
    (useAccountFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom accounts"),
      refetch: refetchAccounts,
    });

    render(<TransfersNextGen />, { wrapper: createWrapper() });
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("retry-button"));
    expect(refetchTransfers).toHaveBeenCalledTimes(1);
  });

  it("opens Add Transfer dialog and submits insert mutation", () => {
    const mockInsert = jest.fn().mockResolvedValue({});
    (useTransferInsertGql.default as jest.Mock).mockReturnValue({
      mutateAsync: mockInsert,
    });

    render(<TransfersNextGen />, { wrapper: createWrapper() });

    // Click the page-level Add Transfer button
    const addButtons = screen.getAllByText("Add Transfer");
    expect(addButtons.length).toBeGreaterThan(0);
    fireEvent.click(addButtons[0]);

    // Set an amount in the mocked input to exercise submit
    const amountInput = screen.getByLabelText(/Amount/i);
    fireEvent.change(amountInput, { target: { value: "100" } });

    // Submit dialog (button label can be "Add Transfer" or "Transfer $100.00")
    const submitButtons = screen.getAllByRole("button");
    const submit = submitButtons.find((b) =>
      /Add Transfer|Transfer \$/.test(b.textContent || ""),
    );
    if (!submit) throw new Error("Submit button not found");
    fireEvent.click(submit);

    expect(mockInsert).toHaveBeenCalled();
  });
});
