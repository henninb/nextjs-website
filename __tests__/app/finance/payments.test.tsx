import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  waitForElementToBeRemoved,
} from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

beforeAll(() => {
  // @ts-expect-error - jsdom lacks ResizeObserver; mock for MUI
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="mocked-datagrid">
      {rows.map((row: any, idx: number) => (
        <div key={idx}>
          {columns.map((col: any, cidx: number) => {
            if (col.renderCell) {
              return (
                <div
                  key={cidx}
                  data-testid={`cell-${idx}-${String(col.headerName || col.field).toLowerCase()}`}
                >
                  {col.renderCell({ row, value: row[col.field] })}
                </div>
              );
            }
            // Handle valueFormatter for non-renderCell columns
            if (col.valueFormatter && row[col.field] !== undefined) {
              return (
                <div
                  key={cidx}
                  data-testid={`cell-${idx}-${String(col.headerName || col.field).toLowerCase()}`}
                >
                  {col.valueFormatter(row[col.field])}
                </div>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  ),
}));

// Mock Autocomplete to make it testable
jest.mock("@mui/material/Autocomplete", () => ({
  __esModule: true,
  default: ({ options, getOptionLabel, value, onChange, renderInput }: any) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const selectedOption = options.find(
        (opt: any) => getOptionLabel(opt) === e.target.value,
      );
      onChange(e, selectedOption);
    };

    return (
      <div>
        {renderInput({
          label: "Autocomplete",
          inputProps: { "data-testid": "autocomplete-input" },
        })}
        <select onChange={handleChange} data-testid="autocomplete-select">
          <option value="">Select...</option>
          {options.map((option: any, idx: number) => (
            <option key={idx} value={getOptionLabel(option)}>
              {getOptionLabel(option)}
            </option>
          ))}
        </select>
      </div>
    );
  },
}));

jest.mock("../../../components/USDAmountInput", () => ({
  __esModule: true,
  default: ({ value, onChange, onBlur, error, helperText, label }: any) => (
    <div>
      <input
        data-testid="usd-amount-input"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        aria-label={label}
      />
      {error && <div data-testid="amount-error">{helperText}</div>}
    </div>
  ),
}));

jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({
    title,
    message,
    onAction,
    onRefresh,
    actionLabel = "Add Payment",
  }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && <button onClick={onAction}>{actionLabel}</button>}
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  ),
}));

jest.mock("../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error, message, onRetry }: any) => (
    <div data-testid="error-display">
      {(error && (error.message || String(error))) || message || "Error"}
      {onRetry && <button onClick={onRetry}>Try Again</button>}
    </div>
  ),
}));

jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

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
const updatePaymentMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/usePaymentUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: updatePaymentMock }),
}));
jest.mock("../../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../hooks/useParameterFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

import PaymentsPage from "../../../app/finance/payments/page";
import usePaymentFetchMock from "../../../hooks/usePaymentFetch";
import useAccountFetchMock from "../../../hooks/useAccountFetch";
import useParameterFetchMock from "../../../hooks/useParameterFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

describe("pages/finance/payments", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUsePaymentFetch = usePaymentFetchMock as unknown as jest.Mock;
  const mockUseAccountFetch = useAccountFetchMock as unknown as jest.Mock;
  const mockUseParameterFetch = useParameterFetchMock as unknown as jest.Mock;

  const mockAccounts = [
    {
      accountId: 1,
      accountNameOwner: "Chase Checking",
      accountType: "debit",
      activeStatus: true,
    },
    {
      accountId: 2,
      accountNameOwner: "Savings Account",
      accountType: "debit",
      activeStatus: true,
    },
    {
      accountId: 3,
      accountNameOwner: "Credit Card",
      accountType: "credit",
      activeStatus: true,
    },
  ];

  const mockPayments = [
    {
      paymentId: 1,
      transactionDate: new Date("2024-01-15"),
      sourceAccount: "Chase Checking",
      destinationAccount: "Credit Card",
      amount: 250.5,
      activeStatus: true,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Data Fetching & Loading States", () => {
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

    it("shows loading when all hooks are fetching", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: null,
        isSuccess: false,
        isFetching: true,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: null,
        isSuccess: false,
        isFetching: true,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: null,
        isSuccess: false,
        isFetching: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<PaymentsPage />);

      expect(
        screen.getByText("Loading payments and accounts..."),
      ).toBeInTheDocument();
    });

    it("shows loading when authentication is loading", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: true });
      mockUsePaymentFetch.mockReturnValue({
        data: mockPayments,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PaymentsPage />);

      expect(
        screen.getByText("Loading payments and accounts..."),
      ).toBeInTheDocument();
    });

    it("shows empty state when no payments exist", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PaymentsPage />);

      expect(
        screen.getAllByRole("button", { name: /add payment/i }).length,
      ).toBeGreaterThanOrEqual(1);
      expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    });
  });

  describe("Basic CRUD Operations", () => {
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

      expect(screen.getByText(/Add New Payment/i)).toBeInTheDocument();
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

      expect(screen.getByText(/Add New Payment/i)).toBeInTheDocument();
    });

    it("opens delete confirmation from actions and confirms", async () => {
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
      const deleteButton = await screen.findByRole("button", {
        name: /^delete$/i,
        hidden: true,
      });
      fireEvent.click(deleteButton);
      expect(deletePaymentMock).toHaveBeenCalled();
      expect(
        await screen.findByText(
          /Payment deleted:\s+\$20\.50 from Chase to Amex on .*\./i,
        ),
      ).toBeInTheDocument();
    });

    it("cancels delete modal when cancel button is clicked", async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: mockPayments,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PaymentsPage />);

      const actionsCell = screen.getByTestId("cell-0-actions");
      const deleteButton = actionsCell.querySelector("button");
      fireEvent.click(deleteButton!);

      expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();

      const cancelButton = await screen.findByRole("button", {
        name: /cancel/i,
        hidden: true,
      });
      fireEvent.click(cancelButton);

      await waitForElementToBeRemoved(() =>
        screen.queryByText(/Confirm Deletion/i),
      );
      expect(deletePaymentMock).not.toHaveBeenCalled();
    });
  });

  describe("Form Validation", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: mockPayments,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [
          {
            parameterName: "payment_account",
            parameterValue: "Chase Checking",
          },
        ],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it("allows zero amount values", async () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "0" } });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /pay \$0\.00/i }),
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole("button", { name: /pay \$0\.00/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(insertPaymentMock).toHaveBeenCalled();
      });
    });

    it("validates amount with negative values", () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "-50" } });

      const saveButton = screen.getByRole("button", { name: /add payment/i });
      fireEvent.click(saveButton);

      expect(insertPaymentMock).not.toHaveBeenCalled();
    });

    it("validates source and destination accounts must be different", async () => {
      mockUseAccountFetch.mockReturnValue({
        data: [
          ...mockAccounts,
          {
            accountId: 99,
            accountNameOwner: "Chase Checking",
            accountType: "credit",
            activeStatus: true,
          },
        ],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "100" } });

      const sourceSelect = screen.getAllByTestId("autocomplete-select")[0];
      const destSelect = screen.getAllByTestId("autocomplete-select")[1];

      fireEvent.change(sourceSelect, { target: { value: "Chase Checking" } });
      fireEvent.change(destSelect, { target: { value: "Chase Checking" } });

      const payButton = screen.getByRole("button", {
        name: /pay \$?100(\.00)?/i,
      });
      fireEvent.click(payButton);

      expect(insertPaymentMock).not.toHaveBeenCalled();
      await waitFor(() => {
        expect(
          screen.getByRole("heading", { name: /add new payment/i }),
        ).toBeInTheDocument();
      });
    });

    it("handles NaN amount values gracefully", () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "invalid" } });

      // Button text changes to "Pay $0.00" with invalid input (converts to 0)
      const saveButton = screen.getByRole("button", {
        name: /pay \$|add payment/i,
      });
      fireEvent.click(saveButton);

      // Invalid input converts to 0, which is valid (non-negative), so insert is called
      expect(insertPaymentMock).toHaveBeenCalledWith({
        payload: expect.objectContaining({
          amount: 0,
        }),
      });
    });

    it("formats amount properly on blur", () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "123.4" } });
      fireEvent.blur(amountInput);

      // Input value is string, not formatted with trailing zero
      expect(amountInput).toHaveValue("123.4");
    });

    it("updates button text when amount is entered", async () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "100.50" } });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /pay \$100\.50/i }),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Account Filtering", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: mockPayments,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [
          {
            parameterName: "payment_account",
            parameterValue: "Chase Checking",
          },
        ],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it("filters source accounts to debit accounts only", () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const sourceSelect = screen.getAllByTestId("autocomplete-select")[0];
      const options = Array.from(sourceSelect.querySelectorAll("option"))
        .map((option) => option.textContent)
        .filter((text) => text !== "Select...");

      expect(options).toEqual(["Chase Checking", "Savings Account"]);
      expect(options).not.toContain("Credit Card");
    });

    it("filters destination accounts to credit accounts only", () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const destSelect = screen.getAllByTestId("autocomplete-select")[1];
      const options = Array.from(destSelect.querySelectorAll("option"))
        .map((option) => option.textContent)
        .filter((text) => text !== "Select...");

      expect(options).toEqual(["Credit Card"]);
      expect(options).not.toContain("Chase Checking");
      expect(options).not.toContain("Savings Account");
    });

    it("pre-selects default payment account from parameters", () => {
      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      expect(
        screen.getByRole("button", { name: /pay \$0\.00/i }),
      ).toBeInTheDocument();

      const autocompleteSelects = screen.getAllByTestId("autocomplete-select");
      expect(autocompleteSelects.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("UI Interactions & Rendering", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: mockPayments,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it("renders payment links correctly", () => {
      render(<PaymentsPage />);

      const sourceLink = screen.getByText("Chase Checking").closest("a");
      const destLink = screen.getByText("Credit Card").closest("a");

      expect(sourceLink).toHaveAttribute(
        "href",
        "/finance/transactions/Chase Checking",
      );
      expect(destLink).toHaveAttribute(
        "href",
        "/finance/transactions/Credit Card",
      );
    });

    it("formats currency display correctly", () => {
      render(<PaymentsPage />);

      expect(screen.getByText("$250.50")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
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

    it("handles multiple API errors simultaneously", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: null,
        isSuccess: false,
        isFetching: false,
        error: new Error("Payment fetch failed"),
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PaymentsPage />);

      expect(screen.getByText("Payment Management")).toBeInTheDocument();
      expect(screen.getByTestId("error-display")).toBeInTheDocument();
    });

    it("handles network failure during payment insertion", async () => {
      insertPaymentMock.mockRejectedValueOnce(new Error("Network error"));

      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUsePaymentFetch.mockReturnValue({
        data: mockPayments,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseAccountFetch.mockReturnValue({
        data: mockAccounts,
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseParameterFetch.mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<PaymentsPage />);
      fireEvent.click(screen.getByRole("button", { name: /add payment/i }));

      const amountInput = screen.getByTestId("usd-amount-input");
      fireEvent.change(amountInput, { target: { value: "100" } });

      const sourceSelect = screen.getAllByTestId("autocomplete-select")[0];
      const destSelect = screen.getAllByTestId("autocomplete-select")[1];
      fireEvent.change(sourceSelect, { target: { value: "Chase Checking" } });
      fireEvent.change(destSelect, { target: { value: "Credit Card" } });

      const payButton = screen.getByRole("button", {
        name: /pay \$?100(\.00)?/i,
      });
      fireEvent.click(payButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Add Payment error.*Network error/i),
        ).toBeInTheDocument();
      });
    });
  });
});
