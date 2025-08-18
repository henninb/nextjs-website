import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock router
jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Stub ResizeObserver
beforeAll(() => {
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock MUI DataGrid to keep test DOM small
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="mocked-datagrid">
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

// Mock complex currency input used inside the Add Payment modal
jest.mock("../../../components/USDAmountInput", () => ({
  __esModule: true,
  default: () => <input data-testid="mock-usd-input" />,
}));

// Auth
jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

// Hooks used by Payments page
jest.mock("../../../hooks/usePaymentFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const insertPaymentMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/usePaymentInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: insertPaymentMock }),
}));
const deletePaymentMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/usePaymentDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: deletePaymentMock }),
}));
jest.mock("../../../hooks/usePaymentUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
jest.mock("../../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../hooks/useParameterFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import PaymentsPage from "../../../pages/finance/payments";
import usePaymentFetchMock from "../../../hooks/usePaymentFetch";
import useAccountFetchMock from "../../../hooks/useAccountFetch";
import useParameterFetchMock from "../../../hooks/useParameterFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

describe("pages/finance/payments", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUsePaymentFetch = usePaymentFetchMock as unknown as jest.Mock;
  const mockUseAccountFetch = useAccountFetchMock as unknown as jest.Mock;
  const mockUseParameterFetch = useParameterFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading while fetching data", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUsePaymentFetch.mockReturnValue({
      data: [],
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });
    mockUseAccountFetch.mockReturnValue({
      data: [],
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });
    mockUseParameterFetch.mockReturnValue({
      data: [],
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsPage />);
    expect(
      screen.getByText(/Loading payments and accounts/i),
    ).toBeInTheDocument();
  });

  it("shows error and retries all fetches", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    const ra = jest.fn();
    const rp = jest.fn();
    const rpar = jest.fn();
    mockUsePaymentFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("payments"),
      refetch: rp,
    });
    mockUseAccountFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("accounts"),
      refetch: ra,
    });
    mockUseParameterFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("params"),
      refetch: rpar,
    });

    render(<PaymentsPage />);
    const tryAgain = screen.getByRole("button", { name: /try again/i });
    fireEvent.click(tryAgain);
    expect(rp).toHaveBeenCalled();
    expect(ra).toHaveBeenCalled();
    expect(rpar).toHaveBeenCalled();
  });

  it("opens Add Payment modal on click", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    mockUsePaymentFetch.mockReturnValue({
      data: [
        {
          paymentId: 1,
          transactionDate: new Date("2024-01-01"),
          sourceAccount: "Chase",
          destinationAccount: "Amex",
          activeStatus: true,
          amount: 20.5,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseAccountFetch.mockReturnValue({
      data: [
        { accountNameOwner: "Chase", accountType: "debit" },
        { accountNameOwner: "Amex", accountType: "credit" },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterName: "payment_account", parameterValue: "Chase" }],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add payment/i }));
    expect(screen.getByText(/Add New Payment/i)).toBeInTheDocument();
  });

  it("adds a new payment (happy path)", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    mockUsePaymentFetch.mockReturnValue({
      data: [
        {
          paymentId: 2,
          transactionDate: new Date("2024-01-02"),
          sourceAccount: "Chase",
          destinationAccount: "Amex",
          activeStatus: true,
          amount: 10,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseAccountFetch.mockReturnValue({
      data: [
        { accountNameOwner: "Chase", accountType: "debit" },
        { accountNameOwner: "Amex", accountType: "credit" },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterName: "payment_account", parameterValue: "Chase" }],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add payment/i }));
    // Minimal interaction; just click the Add button in modal
    fireEvent.click(screen.getByRole("button", { name: /add payment/i }));
    expect(insertPaymentMock).toHaveBeenCalled();
    expect(
      await screen.findByText(/Payment added successfully/i),
    ).toBeInTheDocument();
  });

  it("shows error when add payment fails", async () => {
    insertPaymentMock.mockRejectedValueOnce(new Error("Boom"));
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    mockUsePaymentFetch.mockReturnValue({
      data: [
        {
          paymentId: 2,
          transactionDate: new Date("2024-01-02"),
          sourceAccount: "Chase",
          destinationAccount: "Amex",
          activeStatus: true,
          amount: 10,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseAccountFetch.mockReturnValue({
      data: [
        { accountNameOwner: "Chase", accountType: "debit" },
        { accountNameOwner: "Amex", accountType: "credit" },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterName: "payment_account", parameterValue: "Chase" }],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add payment/i }));
    fireEvent.click(screen.getByRole("button", { name: /add payment/i }));
    expect(insertPaymentMock).toHaveBeenCalled();
    expect(await screen.findByText(/Add Payment error:/i)).toBeInTheDocument();
    expect(await screen.findByText(/Boom/i)).toBeInTheDocument();
  });

  it("opens delete confirmation from actions and confirms", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

    mockUsePaymentFetch.mockReturnValue({
      data: [
        {
          paymentId: 1,
          transactionDate: new Date("2024-01-01"),
          sourceAccount: "Chase",
          destinationAccount: "Amex",
          activeStatus: true,
          amount: 20.5,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseAccountFetch.mockReturnValue({
      data: [
        { accountNameOwner: "Chase", accountType: "debit" },
        { accountNameOwner: "Amex", accountType: "credit" },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterName: "payment_account", parameterValue: "Chase" }],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<PaymentsPage />);
    const actionsCell = screen.getByTestId("cell-0-actions");
    const delBtn = actionsCell.querySelector("button");
    if (!delBtn) throw new Error("Delete button not found");
    fireEvent.click(delBtn);
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(deletePaymentMock).toHaveBeenCalled();
  });
});
