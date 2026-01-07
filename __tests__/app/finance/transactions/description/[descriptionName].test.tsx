import React from "react";
import { render, screen, within, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TransactionsByDescription from "../../../../../app/finance/transactions/description/[descriptionName]/page";
import * as AuthProvider from "../../../../../components/AuthProvider";
import * as useTransactionByDescription from "../../../../../hooks/useTransactionByDescriptionFetch";

// Mock React.use() for testing
const originalReactUse = React.use;
React.use = jest.fn((promise: any) => {
  if (promise instanceof Promise) {
    return originalReactUse(promise);
  }
  return promise;
}) as any;

// Router mock to supply the dynamic route param and capture redirects
const replaceMock = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: jest.fn(),
    pathname: "/finance/transactions/description/Grocery%20Store",
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => "/finance/transactions/description/Grocery%20Store",
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

jest.mock("../../../../../hooks/useTransactionByDescriptionFetch");
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
    <QueryClientProvider client={queryClient}>
      <React.Suspense fallback={<div>Loading...</div>}>
        {children}
      </React.Suspense>
    </QueryClientProvider>
  );
};

const mockRows = [
  {
    transactionId: 1,
    transactionDate: new Date("2024-02-14"),
    accountNameOwner: "Test Checking",
    description: "Grocery Store",
    category: "Food",
    amount: -25,
    activeStatus: true,
    notes: "",
  },
];

describe("TransactionsByDescription page", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useTransactionByDescription.default as jest.Mock).mockReturnValue({
      data: mockRows,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    replaceMock.mockReset();
  });

  it("renders the heading with the description name", async () => {
    render(
      <TransactionsByDescription
        params={{ descriptionName: "Grocery Store" } as any}
      />,
      { wrapper: createWrapper() },
    );
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Grocery Store" }),
      ).toBeInTheDocument();
    });
  });

  it("shows a spinner while loading data", () => {
    (useTransactionByDescription.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(
      <TransactionsByDescription
        params={{ descriptionName: "Grocery Store" } as any}
      />,
      { wrapper: createWrapper() },
    );
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders the data grid with transaction rows", () => {
    render(
      <TransactionsByDescription
        params={{ descriptionName: "Grocery Store" } as any}
      />,
      { wrapper: createWrapper() },
    );

    // DataGrid is globally mocked in __mocks__/@mui/x-data-grid.ts
    const grid = screen.getByTestId("data-grid");
    expect(grid).toBeInTheDocument();
    expect(screen.getByText("Test Checking")).toBeInTheDocument();
    // Ensure we match the row content, not the heading
    expect(within(grid).getByText("Grocery Store")).toBeInTheDocument();
    expect(screen.getByText("-$25.00")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(
      <TransactionsByDescription
        params={{ descriptionName: "Grocery Store" } as any}
      />,
      { wrapper: createWrapper() },
    );
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("displays error state with retry when fetch fails", () => {
    const refetchMock = jest.fn();
    (useTransactionByDescription.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("Failed"),
      refetch: refetchMock,
    });

    render(
      <TransactionsByDescription
        params={{ descriptionName: "Grocery Store" } as any}
      />,
      { wrapper: createWrapper() },
    );
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

      const { rerender } = render(
        <TransactionsByDescription
          params={{ descriptionName: "Grocery Store" } as any}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      // Component should return null but not crash due to hook order violations
      expect(
        screen.queryByRole("heading", { name: "Grocery Store" }),
      ).not.toBeInTheDocument();

      // Second render: loading = false (should call same hooks in same order)
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: true,
        loading: false,
      });

      rerender(
        <TransactionsByDescription
          params={{ descriptionName: "Grocery Store" } as any}
        />,
      );

      // Should render successfully without Rules of Hooks error
      expect(
        screen.getByRole("heading", { name: "Grocery Store" }),
      ).toBeInTheDocument();
    });

    it("calls hooks consistently during authentication state transitions", () => {
      // Test loading -> not authenticated transition
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        loading: true,
      });

      const { rerender } = render(
        <TransactionsByDescription
          params={{ descriptionName: "Grocery Store" } as any}
        />,
        {
          wrapper: createWrapper(),
        },
      );

      // Should return null without hook violations
      expect(
        screen.queryByRole("heading", { name: "Grocery Store" }),
      ).not.toBeInTheDocument();

      // Change to not authenticated, not loading
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      rerender(
        <TransactionsByDescription
          params={{ descriptionName: "Grocery Store" } as any}
        />,
      );

      // Should still return null and trigger redirect
      expect(
        screen.queryByRole("heading", { name: "Grocery Store" }),
      ).not.toBeInTheDocument();
      expect(replaceMock).toHaveBeenCalledWith("/login");
    });

    it("maintains hook order when data changes from null to loaded", () => {
      // Start with no data
      (useTransactionByDescription.default as jest.Mock).mockReturnValue({
        data: null,
        isSuccess: false,
        isFetching: true,
        error: null,
      });

      const { rerender } = render(
        <TransactionsByDescription
          params={{ descriptionName: "Grocery Store" } as any}
        />,
        {
          wrapper: createWrapper(),
        },
      );
      expect(screen.getByTestId("spinner")).toBeInTheDocument();

      // Change to loaded data - useMemo should handle null -> data transition
      (useTransactionByDescription.default as jest.Mock).mockReturnValue({
        data: mockRows,
        isSuccess: true,
        isFetching: false,
        error: null,
      });

      rerender(
        <TransactionsByDescription
          params={{ descriptionName: "Grocery Store" } as any}
        />,
      );

      // Should render data grid without hook order errors
      expect(screen.getByTestId("data-grid")).toBeInTheDocument();
    });
  });
});
