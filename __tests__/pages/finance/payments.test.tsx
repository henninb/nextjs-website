import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Payments from "../../../pages/finance/payments";
import * as useFetchPayment from "../../../hooks/usePaymentFetch";
import * as usePaymentInsert from "../../../hooks/usePaymentInsert";
import * as usePaymentDelete from "../../../hooks/usePaymentDelete";
import * as usePaymentUpdate from "../../../hooks/usePaymentUpdate";
import * as useAccountFetch from "../../../hooks/useAccountFetch";
import * as useParameterFetch from "../../../hooks/useParameterFetch";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/usePaymentFetch");
jest.mock("../../../hooks/usePaymentInsert");
jest.mock("../../../hooks/usePaymentDelete");
jest.mock("../../../hooks/usePaymentUpdate");
jest.mock("../../../hooks/useAccountFetch");
jest.mock("../../../hooks/useParameterFetch");
jest.mock("../../../components/AuthProvider");

const mockPaymentData = [
  {
    paymentId: 1,
    transactionDate: new Date("2024-01-01"),
    sourceAccount: "Checking Account",
    destinationAccount: "Credit Card",
    amount: 250.0,
    accountNameOwner: "Credit Card",
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
    accountNameOwner: "Credit Card",
    accountType: "credit",
    moniker: "CC",
  },
];

const mockParameterData = [
  {
    parameterId: 1,
    parameterName: "payment_account",
    parameterValue: "Checking Account",
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

describe("Payments Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useFetchPayment.default as jest.Mock).mockReturnValue({
      data: mockPaymentData,
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

    (useParameterFetch.default as jest.Mock).mockReturnValue({
      data: mockParameterData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (usePaymentInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (usePaymentUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (usePaymentDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders payment details heading", () => {
    render(<Payments />, { wrapper: createWrapper() });
    expect(screen.getByText("Payment Details")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Payments />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useFetchPayment.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<Payments />, { wrapper: createWrapper() });

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });
});
