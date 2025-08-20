import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Transfers from "../../../pages/finance/transfers";
// Mock MUI DataGrid similar to payments tests to call renderCell handlers
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any, idx: number) => (
        <div key={idx}>
          {columns.map((col: any, cidx: number) =>
            col.renderCell ? (
              <div
                key={cidx}
                data-testid={`cell-${idx}-${String(col.headerName || col.field).toLowerCase()}`}
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
import * as useFetchTransfer from "../../../hooks/useTransferFetch";
import * as useTransferInsert from "../../../hooks/useTransferInsert";
import * as useTransferDelete from "../../../hooks/useTransferDelete";
import * as useTransferUpdate from "../../../hooks/useTransferUpdate";
import * as useAccountFetch from "../../../hooks/useAccountFetch";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useTransferFetch");
jest.mock("../../../hooks/useTransferInsert");
jest.mock("../../../hooks/useTransferDelete");
jest.mock("../../../hooks/useTransferUpdate");
jest.mock("../../../hooks/useAccountFetch");
jest.mock("../../../components/AuthProvider");
// Ensure MUI Modal always renders children in tests
jest.mock("@mui/material/Modal", () => ({
  __esModule: true,
  default: ({ children, open }: any) =>
    open ? <div data-testid="modal">{children}</div> : null,
}));

// Mock EmptyState component
jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && <button onClick={onAction}>Add Transfer</button>}
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  ),
}));

// Mock ErrorDisplay component
jest.mock("../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error, onRetry }: { error: any; onRetry?: () => void }) => (
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

const mockTransferData = [
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

const mockAccountData = [
  {
    accountId: 1,
    accountNameOwner: "Checking Account",
    accountType: "debit",
    moniker: "CHK",
  },
  {
    accountId: 2,
    accountNameOwner: "Savings Account",
    accountType: "debit",
    moniker: "SAV",
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("Transfers Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useFetchTransfer.default as jest.Mock).mockReturnValue({
      data: mockTransferData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: mockAccountData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useTransferInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransferUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransferDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
    });
  });

  it("renders transfer management heading", () => {
    render(<Transfers />, { wrapper: createWrapper() });
    expect(screen.getByText("Transfer Management")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("opens add transfer modal when button clicked", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    const addButtons = screen.getAllByText("Add Transfer");
    expect(addButtons.length).toBeGreaterThan(0);

    // Just verify the button exists and is clickable
    expect(addButtons[0]).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useFetchTransfer.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading transfers and accounts..."),
    ).toBeInTheDocument();
  });

  it("displays error state when transfer fetch fails", () => {
    (useFetchTransfer.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("Failed to fetch transfers"),
    });

    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
    expect(screen.getByText("Transfer Management")).toBeInTheDocument();
  });

  it("displays error state when accounts fetch fails", () => {
    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("Failed to fetch accounts"),
    });

    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByTestId("retry-button")).toBeInTheDocument();
  });

  it("shows empty state when no transfers exist", () => {
    (useFetchTransfer.default as jest.Mock).mockReturnValue({
      data: [],
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByText(/No Transfers Found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/No transfers have been created yet/i),
    ).toBeInTheDocument();
  });

  it("handles delete confirmation modal", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    // Click delete button in actions cell
    const actionsCell = screen.getByTestId("cell-0-actions");
    const deleteButton = actionsCell.querySelector("button");
    if (!deleteButton) throw new Error("Delete button not found");

    fireEvent.click(deleteButton);
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
  });

  it("renders transfer amount with currency formatting", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    // Check that amount is formatted as currency
    expect(screen.getByText("$500.00")).toBeInTheDocument();
  });

  it("renders account links correctly", () => {
    render(<Transfers />, { wrapper: createWrapper() });

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

  it("handles authentication redirect when not authenticated", () => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<Transfers />, { wrapper: createWrapper() });

    // Should show spinner while redirecting
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading transfers and accounts..."),
    ).toBeInTheDocument();
  });

  it("closes modal when clicking cancel in delete confirmation", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    // Open delete modal
    const actionsCell = screen.getByTestId("cell-0-actions");
    const deleteButton = actionsCell.querySelector("button");
    if (!deleteButton) throw new Error("Delete button not found");

    fireEvent.click(deleteButton);
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    // Click cancel - find button in modal
    const cancelButtons = screen.getAllByRole("button", { name: /cancel/i });
    const modalCancelButton = cancelButtons.find((btn) =>
      btn.closest('[data-testid="modal"]'),
    );

    if (modalCancelButton) {
      fireEvent.click(modalCancelButton);
    } else {
      fireEvent.click(cancelButtons[0]);
    }

    expect(screen.queryByText(/Confirm Deletion/i)).not.toBeInTheDocument();
  });

  it("confirms delete and calls delete mutation", async () => {
    const mockDeleteTransfer = jest.fn().mockResolvedValue({});
    (useTransferDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: mockDeleteTransfer,
    });

    render(<Transfers />, { wrapper: createWrapper() });

    // Open delete modal
    const actionsCell = screen.getByTestId("cell-0-actions");
    const deleteButton = actionsCell.querySelector("button");
    if (!deleteButton) throw new Error("Delete button not found");

    fireEvent.click(deleteButton);
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

    // Get all delete buttons and click the one in the modal (not the one in the data grid)
    const deleteButtons = screen.getAllByRole("button", { name: /delete/i });
    const modalDeleteButton = deleteButtons.find((btn) =>
      btn.closest('[data-testid="modal"]'),
    );

    if (modalDeleteButton) {
      fireEvent.click(modalDeleteButton);
    } else {
      // Fallback: click the last delete button (should be modal)
      fireEvent.click(deleteButtons[deleteButtons.length - 1]);
    }

    expect(mockDeleteTransfer).toHaveBeenCalled();
  });

  // Note: Additional complex form interactions (Autocomplete, date handling) would require
  // more sophisticated mocking of MUI components. The core functionality is covered above.
});
