/**
 * Tests for Monthly Spending Trends page
 * Comprehensive test coverage following TDD principles
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { UIProvider } from "../../../contexts/UIContext";
import TrendsPage from "../../../pages/finance/trends";
import * as useSpendingTrends from "../../../hooks/useSpendingTrends";
import * as useAccountFetch from "../../../hooks/useAccountFetch";
import * as useCategoryFetch from "../../../hooks/useCategoryFetch";
import * as AuthProvider from "../../../components/AuthProvider";

// Mock the hooks
jest.mock("../../../hooks/useSpendingTrends");
jest.mock("../../../hooks/useAccountFetch");
jest.mock("../../../hooks/useCategoryFetch");
jest.mock("../../../components/AuthProvider");

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

// Mock recharts (chart library)
jest.mock("recharts", () => ({
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  Bar: () => <div data-testid="bar" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="chart-tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <UIProvider>{children}</UIProvider>
    </QueryClientProvider>
  );
};

const mockTrendsData = {
  monthlySpending: [
    {
      yearMonth: "2024-06",
      totalSpend: 1500.0,
      transactionCount: 25,
      categories: {
        Food: 600.0,
        Transportation: 400.0,
        Entertainment: 300.0,
        Shopping: 200.0,
      },
    },
    {
      yearMonth: "2024-05",
      totalSpend: 1300.0,
      transactionCount: 20,
      categories: {
        Food: 550.0,
        Transportation: 350.0,
        Entertainment: 250.0,
        Shopping: 150.0,
      },
    },
    {
      yearMonth: "2024-04",
      totalSpend: 1200.0,
      transactionCount: 18,
      categories: {
        Food: 500.0,
        Transportation: 300.0,
        Entertainment: 250.0,
        Shopping: 150.0,
      },
    },
  ],
  currentMonth: {
    yearMonth: "2024-06",
    totalSpend: 1500.0,
    transactionCount: 25,
    categories: {
      Food: 600.0,
      Transportation: 400.0,
      Entertainment: 300.0,
      Shopping: 200.0,
    },
  },
  previousMonth: {
    yearMonth: "2024-05",
    totalSpend: 1300.0,
    transactionCount: 20,
    categories: {
      Food: 550.0,
      Transportation: 350.0,
      Entertainment: 250.0,
      Shopping: 150.0,
    },
  },
  monthOverMonth: {
    currentAmount: 1500.0,
    previousAmount: 1300.0,
    absoluteChange: 200.0,
    percentageChange: 15.38,
  },
  topCategories: [
    { category: "Food", amount: 600.0, percentage: 40.0 },
    { category: "Transportation", amount: 400.0, percentage: 26.67 },
    { category: "Entertainment", amount: 300.0, percentage: 20.0 },
    { category: "Shopping", amount: 200.0, percentage: 13.33 },
  ],
  categoryChanges: [
    {
      category: "Food",
      currentAmount: 600.0,
      previousAmount: 550.0,
      absoluteChange: 50.0,
      percentageChange: 9.09,
    },
    {
      category: "Transportation",
      currentAmount: 400.0,
      previousAmount: 350.0,
      absoluteChange: 50.0,
      percentageChange: 14.29,
    },
  ],
};

const mockAccountData = [
  { accountId: 1, accountNameOwner: "checking-account", accountType: "debit" },
  { accountId: 2, accountNameOwner: "savings-account", accountType: "debit" },
  { accountId: 3, accountNameOwner: "credit-card", accountType: "credit" },
];

const mockCategoryData = [
  { categoryId: 1, categoryName: "Food", activeStatus: "active" },
  { categoryId: 2, categoryName: "Transportation", activeStatus: "active" },
  { categoryId: 3, categoryName: "Entertainment", activeStatus: "active" },
  { categoryId: 4, categoryName: "Shopping", activeStatus: "active" },
];

describe("TrendsPage", () => {
  beforeEach(() => {
    // Mock successful authentication
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    // Mock successful data fetching
    (useSpendingTrends.default as jest.Mock).mockReturnValue({
      data: mockTrendsData,
      isLoading: false,
      isError: false,
      error: null,
    });

    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: mockAccountData,
      isLoading: false,
      isError: false,
      error: null,
    });

    (useCategoryFetch.default as jest.Mock).mockReturnValue({
      data: mockCategoryData,
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  describe("Page Structure", () => {
    it("should render page header with correct title and subtitle", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("heading", { name: /monthly spending trends/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByText(
          /analyze your spending patterns and track month-over-month changes/i,
        ),
      ).toBeInTheDocument();
    });

    it("should render in FinanceLayout", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      // Check for FinanceLayout characteristics
      expect(screen.getByRole("heading")).toBeInTheDocument();
    });
  });

  describe("Hero KPIs Section", () => {
    it("should display current month total spend with correct formatting", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("$1,500.00")).toBeInTheDocument();
      expect(screen.getByText("Total Spend")).toBeInTheDocument();
    });

    it("should display transaction count", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("25")).toBeInTheDocument();
      expect(screen.getByText("Transactions")).toBeInTheDocument();
    });

    it("should display top category", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("Top Category")).toBeInTheDocument();
    });

    it("should display month-over-month percentage change", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("+15.38%")).toBeInTheDocument();
      expect(screen.getByText("vs Last Month")).toBeInTheDocument();
    });

    it("should display negative month-over-month change correctly", () => {
      const mockDataWithDecrease = {
        ...mockTrendsData,
        monthOverMonth: {
          currentAmount: 1200.0,
          previousAmount: 1500.0,
          absoluteChange: -300.0,
          percentageChange: -20.0,
        },
      };

      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: mockDataWithDecrease,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("-20.00%")).toBeInTheDocument();
    });

    it("should handle null month-over-month data gracefully", () => {
      const mockDataWithNullMoM = {
        ...mockTrendsData,
        monthOverMonth: null,
      };

      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: mockDataWithNullMoM,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("N/A")).toBeInTheDocument();
    });
  });

  describe("Charts Section", () => {
    it("should render monthly spending line chart", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Monthly Spending Trend")).toBeInTheDocument();
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    it("should render category breakdown bar chart", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Spending by Category")).toBeInTheDocument();
      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
    });

    it("should have toggle for stacked category view", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      const stackedToggle = screen.getByRole("checkbox", {
        name: /stacked view/i,
      });
      expect(stackedToggle).toBeInTheDocument();

      // Test toggle functionality
      fireEvent.click(stackedToggle);
      expect(stackedToggle).toBeChecked();
    });
  });

  describe("Filters Section", () => {
    it("should render date range filter with preset options", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/date range/i)).toBeInTheDocument();

      // Check for preset options
      expect(screen.getByText("6 months")).toBeInTheDocument();
      expect(screen.getByText("12 months")).toBeInTheDocument();
      expect(screen.getByText("24 months")).toBeInTheDocument();
    });

    it("should render account filter with multi-select", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/accounts/i)).toBeInTheDocument();

      // Should be able to select multiple accounts
      const accountFilter = screen.getByLabelText(/accounts/i);
      expect(accountFilter).toBeInTheDocument();
    });

    it("should render category filter with include/exclude options", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/categories/i)).toBeInTheDocument();
    });

    it("should have toggle for excluding transfers", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      const transferToggle = screen.getByRole("checkbox", {
        name: /exclude transfers/i,
      });
      expect(transferToggle).toBeInTheDocument();
      expect(transferToggle).toBeChecked(); // Should be checked by default
    });

    it("should update data when filters change", async () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      const dateRangeSelect = screen.getByLabelText(/date range/i);
      fireEvent.click(dateRangeSelect);

      // Select 6 months option
      const sixMonthsOption = screen.getByText("6 months");
      fireEvent.click(sixMonthsOption);

      await waitFor(() => {
        // Verify the hook was called with new filters
        expect(useSpendingTrends.default).toHaveBeenCalledWith(
          expect.objectContaining({
            dateRange: { months: 6 },
          }),
        );
      });
    });
  });

  describe("Breakdown Section", () => {
    it("should display top categories for current month", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Top Categories This Month")).toBeInTheDocument();

      // Check for category data
      expect(screen.getByText("Food")).toBeInTheDocument();
      expect(screen.getByText("$600.00")).toBeInTheDocument();
      expect(screen.getByText("40.0%")).toBeInTheDocument();

      expect(screen.getByText("Transportation")).toBeInTheDocument();
      expect(screen.getByText("$400.00")).toBeInTheDocument();
    });

    it("should display category changes with month-over-month deltas", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Biggest Changes")).toBeInTheDocument();

      // Check for category change data
      expect(screen.getByText("+$50.00")).toBeInTheDocument();
      expect(screen.getByText("+9.09%")).toBeInTheDocument();
    });

    it("should display increases and decreases with appropriate styling", () => {
      const mockDataWithDecrease = {
        ...mockTrendsData,
        categoryChanges: [
          ...mockTrendsData.categoryChanges,
          {
            category: "Entertainment",
            currentAmount: 200.0,
            previousAmount: 300.0,
            absoluteChange: -100.0,
            percentageChange: -33.33,
          },
        ],
      };

      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: mockDataWithDecrease,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      // Should show both increases and decreases
      expect(screen.getByText("+$50.00")).toBeInTheDocument(); // Increase
      expect(screen.getByText("-$100.00")).toBeInTheDocument(); // Decrease
    });
  });

  describe("Loading State", () => {
    it("should display loading state when data is being fetched", () => {
      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/loading spending trends/i)).toBeInTheDocument();
      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });

    it("should show loading state when supporting data is loading", () => {
      (useAccountFetch.default as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("Error State", () => {
    it("should display error state when trends data fails to load", () => {
      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: { message: "Failed to fetch trends data" },
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(
        screen.getByText(/error loading spending trends/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Try again")).toBeInTheDocument();
    });

    it("should have retry functionality in error state", async () => {
      const mockRefetch = jest.fn();
      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        isError: true,
        error: { message: "Failed to fetch trends data" },
        refetch: mockRefetch,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      const retryButton = screen.getByText("Try again");
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe("Empty State", () => {
    it("should display empty state when no spending data is available", () => {
      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: {
          monthlySpending: [],
          currentMonth: null,
          previousMonth: null,
          monthOverMonth: null,
          topCategories: [],
          categoryChanges: [],
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText(/no spending data found/i)).toBeInTheDocument();
      expect(
        screen.getByText(
          /start by adding some transactions to see your spending trends/i,
        ),
      ).toBeInTheDocument();
    });

    it("should provide navigation to add transactions in empty state", () => {
      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: {
          monthlySpending: [],
          currentMonth: null,
          previousMonth: null,
          monthOverMonth: null,
          topCategories: [],
          categoryChanges: [],
        },
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Add Transactions")).toBeInTheDocument();
    });
  });

  describe("Authentication", () => {
    it("should redirect to login when not authenticated", () => {
      const mockReplace = jest.fn();
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        loading: false,
      });

      jest.doMock("next/router", () => ({
        useRouter: () => ({
          replace: mockReplace,
        }),
      }));

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(mockReplace).toHaveBeenCalledWith("/login");
    });

    it("should show spinner when authentication is loading", () => {
      (AuthProvider.useAuth as jest.Mock).mockReturnValue({
        isAuthenticated: false,
        loading: true,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(screen.getByRole("progressbar")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA labels for chart elements", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      expect(
        screen.getByRole("region", { name: /monthly spending chart/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("region", { name: /category breakdown chart/i }),
      ).toBeInTheDocument();
    });

    it("should have proper semantic structure for KPIs", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      // KPIs should be in a proper container with appropriate roles
      expect(
        screen.getByRole("region", { name: /key performance indicators/i }),
      ).toBeInTheDocument();
    });

    it("should support keyboard navigation for filters", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      const dateRangeFilter = screen.getByLabelText(/date range/i);
      expect(dateRangeFilter).toHaveAttribute("tabindex", "0");

      const transferToggle = screen.getByRole("checkbox", {
        name: /exclude transfers/i,
      });
      expect(transferToggle).toHaveAttribute("tabindex", "0");
    });

    it("should have high contrast colors for positive and negative changes", () => {
      render(<TrendsPage />, { wrapper: createWrapper() });

      // Verify that increase/decrease indicators have appropriate styling classes
      const positiveChange = screen.getByText("+15.38%");
      expect(positiveChange).toHaveClass("positive-change");

      // Set up data with negative change
      const mockDataWithNegative = {
        ...mockTrendsData,
        monthOverMonth: {
          ...mockTrendsData.monthOverMonth,
          percentageChange: -10.5,
        },
      };

      (useSpendingTrends.default as jest.Mock).mockReturnValue({
        data: mockDataWithNegative,
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<TrendsPage />, { wrapper: createWrapper() });

      const negativeChange = screen.getByText("-10.50%");
      expect(negativeChange).toHaveClass("negative-change");
    });
  });
});
