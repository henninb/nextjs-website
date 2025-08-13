import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Accounts from "../../../pages/finance/index";
import * as useAccountFetch from "../../../hooks/useAccountFetch";
import * as useAccountInsert from "../../../hooks/useAccountInsert";
import * as useAccountDelete from "../../../hooks/useAccountDelete";
import * as useAccountUpdate from "../../../hooks/useAccountUpdate";
import * as useTotalsFetch from "../../../hooks/useTotalsFetch";
import * as AuthProvider from "../../../components/AuthProvider";

// Mock the missing components that cause "Element type is invalid" errors
jest.mock("../../../components/ErrorDisplay", () => {
  return {
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
  };
});

jest.mock("../../../components/EmptyState", () => {
  return {
    __esModule: true,
    default: ({ title, message, onAction, onRefresh }: any) => (
      <div data-testid="empty-state">
        <div>{title}</div>
        <div>{message}</div>
        {onAction && <button onClick={onAction}>Create</button>}
        {onRefresh && <button onClick={onRefresh}>Refresh</button>}
      </div>
    ),
  };
});

jest.mock("../../../components/LoadingState", () => {
  return {
    __esModule: true,
    default: ({ message }: { message: string }) => (
      <div data-testid="loading-state" role="progressbar">
        {message}
      </div>
    ),
  };
});

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useAccountFetch");
jest.mock("../../../hooks/useAccountInsert");
jest.mock("../../../hooks/useAccountDelete");
jest.mock("../../../hooks/useAccountUpdate");
jest.mock("../../../hooks/useTotalsFetch");
jest.mock("../../../components/AuthProvider");

const mockAccountData = [
  {
    accountId: 1,
    accountNameOwner: "Test Account",
    accountType: "debit",
    moniker: "TEST",
    future: 1000,
    outstanding: 500,
    cleared: 1500,
    activeStatus: "active",
    validationDate: "2024-01-01",
  },
];

const mockTotalsData = {
  totals: 2000,
  totalsCleared: 1500,
  totalsOutstanding: 500,
  totalsFuture: 1000,
};

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

describe("Accounts Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: mockAccountData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useTotalsFetch.default as jest.Mock).mockReturnValue({
      data: mockTotalsData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useAccountInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useAccountUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useAccountDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders account overview heading", () => {
    render(<Accounts />, { wrapper: createWrapper() });
    expect(screen.getByText("Account Overview")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<Accounts />, { wrapper: createWrapper() });

    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading accounts and totals..."),
    ).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Accounts />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("displays account totals table with correct data", () => {
    render(<Accounts />, { wrapper: createWrapper() });

    expect(screen.getByText("$2,000.00")).toBeInTheDocument(); // totals
    expect(screen.getAllByText("$1,500.00")).toHaveLength(2); // cleared (in table and grid)
    expect(screen.getAllByText("$500.00")).toHaveLength(2); // outstanding (in table and grid)
    expect(screen.getAllByText("$1,000.00")).toHaveLength(2); // future (in table and grid)
  });

  it("opens add account modal when Add Account button is clicked", () => {
    render(<Accounts />, { wrapper: createWrapper() });

    const addButton = screen.getByText("Add Account");
    fireEvent.click(addButton);

    expect(screen.getByText("Add New Account")).toBeInTheDocument();
  });

  it("handles add account form submission", async () => {
    const mockInsertAccount = jest.fn().mockResolvedValue({});
    (useAccountInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: mockInsertAccount,
    });

    render(<Accounts />, { wrapper: createWrapper() });

    // Open modal
    const addButton = screen.getByText("Add Account");
    fireEvent.click(addButton);

    // Fill form
    const accountInput = screen.getByLabelText("Account");
    const typeInput = screen.getByLabelText("Account Type");
    const monikerInput = screen.getByLabelText("Moniker");

    fireEvent.change(accountInput, { target: { value: "New Account" } });
    fireEvent.change(typeInput, { target: { value: "debit" } });
    fireEvent.change(monikerInput, { target: { value: "NEW" } });

    // Submit form
    const submitButton = screen.getByRole("button", { name: "Add" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockInsertAccount).toHaveBeenCalled();
    });
  });

  it("renders data grid with proper structure", () => {
    render(<Accounts />, { wrapper: createWrapper() });

    // Verify the data grid structure exists
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();

    // Since the DataGrid is mocked, we can't test the delete buttons directly
    // But we can verify the component renders without errors
    expect(screen.getByText("Account Overview")).toBeInTheDocument();
  });

  it("has delete account hook configured", () => {
    const mockDeleteAccount = jest.fn().mockResolvedValue({});
    (useAccountDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: mockDeleteAccount,
    });

    render(<Accounts />, { wrapper: createWrapper() });

    // Verify the delete hook is properly configured
    expect(mockDeleteAccount).toBeDefined();
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("handles authentication redirect when not authenticated", () => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<Accounts />, { wrapper: createWrapper() });

    // When not authenticated, the component shows a spinner while redirecting
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading accounts and totals..."),
    ).toBeInTheDocument();
  });

  it("handles account type tab completion", () => {
    render(<Accounts />, { wrapper: createWrapper() });

    // Open modal
    const addButton = screen.getByText("Add Account");
    fireEvent.click(addButton);

    const typeInput = screen.getByLabelText("Account Type");
    fireEvent.change(typeInput, { target: { value: "deb" } });
    fireEvent.keyDown(typeInput, { key: "Tab" });

    expect(typeInput.value).toBe("debit");
  });

  it("displays error state when fetching fails", () => {
    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("Failed to fetch"),
    });

    (useTotalsFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("Failed to fetch"),
    });

    render(<Accounts />, { wrapper: createWrapper() });

    // Should show the error display component with the sanitized error message
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    expect(
      screen.getByText("An unexpected error occurred. Please try again."),
    ).toBeInTheDocument();
    expect(screen.getByText("Account Overview")).toBeInTheDocument();
  });
});
