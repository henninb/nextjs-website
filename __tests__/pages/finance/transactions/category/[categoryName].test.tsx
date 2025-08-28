import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TransactionsByCategory from "../../../../../pages/finance/transactions/category/[categoryName]";
import * as AuthProvider from "../../../../../components/AuthProvider";
import * as useTransactionByCategory from "../../../../../hooks/useTransactionByCategoryFetch";

// Router mock to supply the dynamic route param and capture redirects
const replaceMock = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { categoryName: "Food" },
    replace: replaceMock,
  }),
}));

// Mock Spinner and FinanceLayout to keep DOM minimal and stable
jest.mock("../../../../../components/Spinner", () => ({
  __esModule: true,
  default: () => <div data-testid="spinner">Loading...</div>,
}));

jest.mock("../../../../../layouts/FinanceLayout", () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="finance-layout">{children}</div>
  ),
}));

jest.mock("../../../../../components/SnackbarBaseline", () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => (
    <div data-testid="snackbar">{message}</div>
  ),
}));

jest.mock("../../../../../components/ErrorDisplay", () => ({
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

jest.mock("../../../../../hooks/useTransactionByCategoryFetch");
jest.mock("../../../../../hooks/useTransactionUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn() }),
}));
jest.mock("../../../../../components/AuthProvider");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockRows = [
  {
    transactionId: 1,
    transactionDate: new Date("2024-01-01"),
    accountNameOwner: "Test Checking",
    description: "Groceries",
    category: "Food",
    amount: -45.5,
    activeStatus: true,
    notes: "",
  },
];

describe("TransactionsByCategory page", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useTransactionByCategory.default as jest.Mock).mockReturnValue({
      data: mockRows,
      isSuccess: true,
      error: null,
    });

    replaceMock.mockReset();
  });

  it("renders the heading with the category name", () => {
    render(<TransactionsByCategory />, { wrapper: createWrapper() });
    expect(screen.getByText("Food")).toBeInTheDocument();
  });

  it("shows a spinner while loading data", () => {
    (useTransactionByCategory.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<TransactionsByCategory />, { wrapper: createWrapper() });
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders the data grid with transaction rows", () => {
    render(<TransactionsByCategory />, { wrapper: createWrapper() });

    // DataGrid is globally mocked in __mocks__/@mui/x-data-grid.ts
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
    // The mocked DataGrid renders key fields for each row
    expect(screen.getByText("Test Checking")).toBeInTheDocument();
    expect(screen.getByText("Groceries")).toBeInTheDocument();
    // Negative amount formatted by the DataGrid mock
    expect(screen.getByText("-$45.50")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<TransactionsByCategory />, { wrapper: createWrapper() });

    // Component renders nothing and triggers a redirect
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("displays error state with retry when fetch fails", () => {
    const refetchMock = jest.fn();
    (useTransactionByCategory.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("Failed"),
      refetch: refetchMock,
    });

    render(<TransactionsByCategory />, { wrapper: createWrapper() });
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    const btn = screen.getByTestId("retry-button");
    btn.click();
    expect(refetchMock).toHaveBeenCalled();
  });

  describe("Rules of Hooks compliance", () => {
    it("calls hooks consistently during loading state transitions", () => {
      // This test ensures hooks are called in the same order even when
      // loading state changes, preventing "Rendered more hooks than during the previous render" error
      
      // First render: loading = true (should still call all hooks before early return)
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        loading: true,
      });

      const { rerender } = render(<TransactionsByCategory />, { wrapper: createWrapper() });
      
      // Component should return null but not crash due to hook order violations
      expect(screen.queryByTestId("finance-layout")).not.toBeInTheDocument();

      // Second render: loading = false (should call same hooks in same order)
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        loading: false,
      });

      rerender(<TransactionsByCategory />);
      
      // Should render successfully without Rules of Hooks error
      expect(screen.getByTestId("finance-layout")).toBeInTheDocument();
    });

    it("calls hooks consistently during authentication state transitions", () => {
      // Test loading -> not authenticated transition
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        loading: true,
      });

      const { rerender } = render(<TransactionsByCategory />, { wrapper: createWrapper() });
      
      // Should return null without hook violations
      expect(screen.queryByTestId("finance-layout")).not.toBeInTheDocument();

      // Change to not authenticated, not loading
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      rerender(<TransactionsByCategory />);
      
      // Should still return null and trigger redirect
      expect(screen.queryByTestId("finance-layout")).not.toBeInTheDocument();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });

    it("maintains hook order when data changes from null to loaded", () => {
      // Start with no data
      (useTransactionByCategory.default as jest.Mock).mockReturnValue({
        data: null,
        isSuccess: false,
        isFetching: true,
        error: null,
      });

      const { rerender } = render(<TransactionsByCategory />, { wrapper: createWrapper() });
      expect(screen.getByTestId("spinner")).toBeInTheDocument();

      // Change to loaded data - useMemo should handle null -> data transition
      (useTransactionByCategory.default as jest.Mock).mockReturnValue({
        data: mockRows,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      rerender(<TransactionsByCategory />);
      
      // Should render data grid without hook order errors
      expect(screen.getByTestId("data-grid")).toBeInTheDocument();
    });
  });
});
