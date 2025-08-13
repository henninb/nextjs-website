import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PaymentRequired from "../../../pages/finance/paymentrequired";
import * as useFetchPaymentRequired from "../../../hooks/usePaymentRequiredFetch";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/usePaymentRequiredFetch");
jest.mock("../../../components/AuthProvider");

const mockPaymentRequiredData = [
  {
    accountNameOwner: "Test Account",
    accountType: "debit",
    moniker: "TEST",
    future: 1000,
    outstanding: 500,
    cleared: 1500,
    validationDate: "2024-01-01T00:00:00.000Z",
  },
  {
    accountNameOwner: "Credit Card",
    accountType: "credit",
    moniker: "CC",
    future: 0,
    outstanding: 250,
    cleared: -250,
    validationDate: "2024-01-02T00:00:00.000Z",
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

describe("PaymentRequired Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useFetchPaymentRequired.default as jest.Mock).mockReturnValue({
      data: mockPaymentRequiredData,
      isSuccess: true,
      isFetching: false,
    });
  });

  it("renders account balances heading", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });
    expect(screen.getByText("Account Balances")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useFetchPaymentRequired.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
    });

    render(<PaymentRequired />, { wrapper: createWrapper() });

    // Check for either the old spinner or new LoadingState component
    const loader = screen.queryByTestId("loader");
    const progressbar = screen.queryByRole("progressbar");
    expect(loader || progressbar).toBeInTheDocument();
  });

  it("renders payment required table when data is loaded", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.getByTestId("payment-required-table")).toBeInTheDocument();
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("displays account data correctly in the grid", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.getByText("Test Account")).toBeInTheDocument();
    expect(screen.getByText("Credit Card")).toBeInTheDocument();
    expect(screen.getByText("debit")).toBeInTheDocument();
    expect(screen.getByText("credit")).toBeInTheDocument();
  });

  it("formats currency values correctly", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.getByText("$1,000.00")).toBeInTheDocument(); // future
    expect(screen.getByText("$500.00")).toBeInTheDocument(); // outstanding
    expect(screen.getByText("$1,500.00")).toBeInTheDocument(); // cleared
  });

  it("formats validation dates correctly", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    // Check that dates are formatted in US locale
    const dateElements = screen.getAllByText(/1\/[12]\/2024/);
    expect(dateElements.length).toBeGreaterThan(0);
  });

  it("handles authentication redirect when not authenticated", () => {
    const mockReplace = jest.fn();

    // Mock useRouter for this test
    const mockUseRouter = jest.spyOn(require("next/router"), "useRouter");
    mockUseRouter.mockReturnValue({
      replace: mockReplace,
    });

    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: false,
    });

    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(mockReplace).toHaveBeenCalledWith("/login");

    // Cleanup
    mockUseRouter.mockRestore();
  });

  it("shows spinner when authentication is loading", () => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: false,
      loading: true,
    });

    render(<PaymentRequired />, { wrapper: createWrapper() });

    // Check for either the old spinner or new LoadingState component
    const loader = screen.queryByTestId("loader");
    const progressbar = screen.queryByRole("progressbar");
    expect(loader || progressbar).toBeInTheDocument();
  });

  it("stops showing spinner when data loading completes", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.queryByTestId("loader")).not.toBeInTheDocument();
    expect(screen.getByTestId("payment-required-table")).toBeInTheDocument();
  });

  it("handles empty data gracefully", () => {
    (useFetchPaymentRequired.default as jest.Mock).mockReturnValue({
      data: [],
      isSuccess: true,
      isFetching: false,
    });

    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
    expect(screen.queryByText("Test Account")).not.toBeInTheDocument();
  });

  it("handles null data gracefully", () => {
    (useFetchPaymentRequired.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: true,
      isFetching: false,
    });

    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("displays proper account links", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    const accountLinks = screen.getAllByRole("link");
    expect(accountLinks[0]).toHaveAttribute(
      "href",
      "/finance/transactions/Test Account",
    );
    expect(accountLinks[1]).toHaveAttribute(
      "href",
      "/finance/transactions/Credit Card",
    );
  });

  it("displays moniker values correctly", () => {
    render(<PaymentRequired />, { wrapper: createWrapper() });

    expect(screen.getByText("TEST")).toBeInTheDocument();
    expect(screen.getByText("CC")).toBeInTheDocument();
  });
});
