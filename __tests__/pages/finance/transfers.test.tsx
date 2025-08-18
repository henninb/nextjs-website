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
  default: ({ children }: any) => <div data-testid="modal">{children}</div>,
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

  it("opens add transfer modal with standardized title", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    const addButtons = screen.getAllByText("Add Transfer");
    addButtons[0].click();

    expect(screen.getByText("Add New Transfer")).toBeInTheDocument();
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

  // Note: Snackbar message assertions for transfers are covered indirectly via payments tests.
  // The transfers DataGrid interactions are heavily mocked; keeping tests focused on rendering behavior.
});
