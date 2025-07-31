import React from "react";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Transfers from "../../../pages/finance/transfers";
import * as useFetchTransfer from "../../../hooks/useTransferFetch";
import * as useTransferInsert from "../../../hooks/useTransferInsert";
import * as useTransferDelete from "../../../hooks/useTransferDelete";
import * as useTransferUpdate from "../../../hooks/useTransferUpdate";
import * as useAccountFetch from "../../../hooks/useAccountFetch";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useTransferFetch");
jest.mock("../../../hooks/useTransferInsert");
jest.mock("../../../hooks/useTransferDelete");
jest.mock("../../../hooks/useTransferUpdate");
jest.mock("../../../hooks/useAccountFetch");
jest.mock("../../../components/AuthProvider");
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

const mockTransferData = [
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

const mockAccountData = [
  {
    accountId: 1,
    accountNameOwner: "Checking Account",
    accountType: "debit",
    moniker: "CHK",
  },
  {
    accountId: 2,
    accountNameOwner: "Savings Account",
    accountType: "debit",
    moniker: "SAV",
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

describe("Transfers Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useFetchTransfer.default as jest.Mock).mockReturnValue({
      data: mockTransferData,
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

    (useTransferInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransferUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useTransferDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders transfer management heading", () => {
    render(<Transfers />, { wrapper: createWrapper() });
    expect(screen.getByText("Transfer Management")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useFetchTransfer.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<Transfers />, { wrapper: createWrapper() });

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });
});
