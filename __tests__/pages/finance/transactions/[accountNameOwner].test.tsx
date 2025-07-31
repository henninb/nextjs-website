import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AccountTransactions from "../../../../pages/finance/transactions/[accountNameOwner]";
import * as useTransactionByAccountFetch from "../../../../hooks/useTransactionByAccountFetch";
import * as useTotalsPerAccountFetch from "../../../../hooks/useTotalsPerAccountFetch";
import * as useValidationAmountFetch from "../../../../hooks/useValidationAmountFetch";
import * as useAccountFetch from "../../../../hooks/useAccountFetch";
import * as useCategoryFetch from "../../../../hooks/useCategoryFetch";
import * as useDescriptionFetch from "../../../../hooks/useDescriptionFetch";
import * as AuthProvider from "../../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    query: { accountNameOwner: "Test Account" },
    replace: jest.fn(),
  }),
}));

jest.mock("../../../../hooks/useTransactionByAccountFetch");
jest.mock("../../../../hooks/useTotalsPerAccountFetch");
jest.mock("../../../../hooks/useValidationAmountFetch");
jest.mock("../../../../hooks/useAccountFetch");
jest.mock("../../../../hooks/useCategoryFetch");
jest.mock("../../../../hooks/useDescriptionFetch");
jest.mock("../../../../hooks/useTransactionUpdate");
jest.mock("../../../../hooks/useTransactionInsert");
jest.mock("../../../../hooks/useTransactionDelete");
jest.mock("../../../../hooks/useValidationAmountInsert");

import * as useTransactionUpdate from "../../../../hooks/useTransactionUpdate";
import * as useTransactionInsert from "../../../../hooks/useTransactionInsert";
import * as useTransactionDelete from "../../../../hooks/useTransactionDelete";
import * as useValidationAmountInsert from "../../../../hooks/useValidationAmountInsert";
jest.mock("../../../../components/AuthProvider");

const mockTransactionData = [
  {
    transactionId: 1,
    accountNameOwner: "Test Account",
    transactionDate: new Date("2024-01-01"),
    description: "Test Transaction",
    category: "Food",
    amount: -50.0,
    cleared: 0,
    transactionState: "outstanding",
    transactionType: "expense",
    reoccurringType: "none",
    activeStatus: true,
  },
];

const mockTotalsData = {
  totals: 1000,
  totalsCleared: 800,
  totalsOutstanding: 200,
  totalsFuture: 0,
};

const mockAccountData = [
  {
    accountId: 1,
    accountNameOwner: "Test Account",
    accountType: "debit",
    moniker: "TEST",
  },
];

const mockCategoryData = [
  { categoryId: 1, categoryName: "Food", activeStatus: "active" },
  { categoryId: 2, categoryName: "Transportation", activeStatus: "active" },
];

const mockDescriptionData = [
  { descriptionId: 1, description: "Grocery Store", activeStatus: "active" },
  { descriptionId: 2, description: "Gas Station", activeStatus: "active" },
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

describe("AccountTransactions Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useTransactionByAccountFetch.default as jest.Mock).mockReturnValue({
      data: mockTransactionData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useTotalsPerAccountFetch.default as jest.Mock).mockReturnValue({
      data: mockTotalsData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useValidationAmountFetch.default as jest.Mock).mockReturnValue({
      data: null,
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

    (useCategoryFetch.default as jest.Mock).mockReturnValue({
      data: mockCategoryData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useDescriptionFetch.default as jest.Mock).mockReturnValue({
      data: mockDescriptionData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useTransactionUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransactionInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransactionDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useValidationAmountInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders account name in heading", () => {
    render(<AccountTransactions />, { wrapper: createWrapper() });
    expect(screen.getByText("Test Account")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useTransactionByAccountFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<AccountTransactions />, { wrapper: createWrapper() });

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<AccountTransactions />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });
});
