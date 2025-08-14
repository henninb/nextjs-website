import React from "react";
import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TransactionsByDescription from "../../../../../pages/finance/transactions/description/[descriptionName]";
import * as AuthProvider from "../../../../../components/AuthProvider";
import * as useTransactionByDescription from "../../../../../hooks/useTransactionByDescriptionFetch";

// Router mock to supply the dynamic route param and capture redirects
const replaceMock = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { descriptionName: "Grocery Store" },
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
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
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

  it("renders the heading with the description name", () => {
    render(<TransactionsByDescription />, { wrapper: createWrapper() });
    expect(
      screen.getByRole("heading", { name: "Grocery Store" }),
    ).toBeInTheDocument();
  });

  it("shows a spinner while loading data", () => {
    (useTransactionByDescription.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<TransactionsByDescription />, { wrapper: createWrapper() });
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
  });

  it("renders the data grid with transaction rows", () => {
    render(<TransactionsByDescription />, { wrapper: createWrapper() });

    // DataGrid is globally mocked in __mocks__/@mui/x-data-grid.ts
    const grid = screen.getByTestId("data-grid");
    expect(grid).toBeInTheDocument();
    expect(screen.getByText("Test Checking")).toBeInTheDocument();
    // Ensure we match the row content, not the heading
    expect(
      within(grid).getByText("Grocery Store"),
    ).toBeInTheDocument();
    expect(screen.getByText("-$25.00")).toBeInTheDocument();
  });

  it("redirects to login when not authenticated", () => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<TransactionsByDescription />, { wrapper: createWrapper() });
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

    render(<TransactionsByDescription />, { wrapper: createWrapper() });
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    const btn = screen.getByTestId("retry-button");
    btn.click();
    expect(refetchMock).toHaveBeenCalled();
  });
});
