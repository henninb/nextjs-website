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
import * as useAccountFetch from "../../../hooks/useAccountFetch";
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

// Mock MUI Autocomplete to better test account selection
jest.mock("@mui/material/Autocomplete", () => {
  return function MockAutocomplete({
    options,
    getOptionLabel,
    value,
    onChange,
    renderInput,
    ...props
  }: any) {
    const handleOptionClick = (option: any) => {
      onChange({}, option);
    };

    // Get label from renderInput to identify which autocomplete this is
    const inputElement = renderInput({
      InputProps: { "aria-label": props["aria-label"] || "autocomplete" },
    });
    const isSourceAccount = inputElement.props.label?.includes("Source");
    const fieldType = isSourceAccount ? "source" : "destination";

    return (
      <div data-testid={`autocomplete-${fieldType}`}>
        {inputElement}
        <div data-testid="autocomplete-options">
          {options.map((option: any, index: number) => (
            <div
              key={index}
              onClick={() => handleOptionClick(option)}
              data-testid={`option-${fieldType}-${getOptionLabel ? getOptionLabel(option) : option}`}
            >
              {getOptionLabel ? getOptionLabel(option) : option}
            </div>
          ))}
        </div>
      </div>
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

jest.mock("../../../hooks/useAccountFetch");
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

    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: mockAccounts,
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
    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom accounts"),
      refetch: refetchAccounts,
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

  describe("Account Dropdown Population", () => {
    it("populates source and destination account dropdowns when dialog opens", async () => {
      render(<TransfersNextGen />, { wrapper: createWrapper() });

      // Click Add Transfer button to open dialog
      const addButton = screen.getByText("Add Transfer");
      fireEvent.click(addButton);

      // Verify Source Account autocomplete is populated
      const sourceAccountField = screen.getByLabelText(/Source Account/i);
      expect(sourceAccountField).toBeInTheDocument();

      // Check if account options are available in both dropdowns
      expect(
        screen.getByTestId("option-source-Checking Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-source-Savings Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-destination-Checking Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-destination-Savings Account"),
      ).toBeInTheDocument();
    });

    it("filters destination accounts when source account is selected", async () => {
      const { waitFor } = require("@testing-library/react");

      render(<TransfersNextGen />, { wrapper: createWrapper() });

      // Open dialog
      fireEvent.click(screen.getByText("Add Transfer"));

      // Initially both accounts should be available in destination
      expect(
        screen.getByTestId("option-destination-Checking Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-destination-Savings Account"),
      ).toBeInTheDocument();

      // Select source account by clicking the option from source dropdown
      fireEvent.click(screen.getByTestId("option-source-Checking Account"));

      // Wait for the component to re-render and filter the destination options
      await waitFor(() => {
        expect(
          screen.queryByTestId("option-destination-Checking Account"),
        ).not.toBeInTheDocument();
      });

      // Destination dropdown should only have Savings Account
      expect(
        screen.getByTestId("option-destination-Savings Account"),
      ).toBeInTheDocument();
    });

    it("resets account options when no source account is selected", async () => {
      render(<TransfersNextGen />, { wrapper: createWrapper() });

      // Open dialog
      fireEvent.click(screen.getByText("Add Transfer"));

      // Initially both accounts should be available for both dropdowns
      expect(
        screen.getByTestId("option-source-Checking Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-source-Savings Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-destination-Checking Account"),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId("option-destination-Savings Account"),
      ).toBeInTheDocument();
    });

    it("handles empty account list gracefully", async () => {
      // Mock empty accounts list
      (useAccountFetch.default as jest.Mock).mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      (useAccountFetchGql.default as jest.Mock).mockReturnValue({
        data: [],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<TransfersNextGen />, { wrapper: createWrapper() });

      // Open dialog
      fireEvent.click(screen.getByText("Add Transfer"));

      // Verify dropdowns are present but no options
      expect(
        screen.queryByTestId("option-source-Checking Account"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("option-source-Savings Account"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("option-destination-Checking Account"),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId("option-destination-Savings Account"),
      ).not.toBeInTheDocument();
    });

    it("updates transfer data when accounts are selected", async () => {
      const mockInsert = jest.fn().mockResolvedValue({});
      (useTransferInsertGql.default as jest.Mock).mockReturnValue({
        mutateAsync: mockInsert,
      });

      render(<TransfersNextGen />, { wrapper: createWrapper() });

      // Open dialog
      fireEvent.click(screen.getByText("Add Transfer"));

      // Select source account
      fireEvent.click(screen.getByTestId("option-source-Checking Account"));

      // Select destination account
      fireEvent.click(screen.getByTestId("option-destination-Savings Account"));

      // Set amount and submit to verify transfer data is populated
      const amountInput = screen.getByLabelText(/Amount/i);
      fireEvent.change(amountInput, { target: { value: "100" } });

      // Submit
      const submitButton = screen.getByRole("button", {
        name: /Transfer \$|Add Transfer/i,
      });
      fireEvent.click(submitButton);

      // Verify the mutation was called with correct data
      expect(mockInsert).toHaveBeenCalledWith({
        payload: expect.objectContaining({
          sourceAccount: "Checking Account",
          destinationAccount: "Savings Account",
          amount: "100", // Amount comes through as string from input
        }),
      });
    });
  });
});
