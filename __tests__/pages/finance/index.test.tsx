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

  it("renders account details heading", () => {
    render(<Accounts />, { wrapper: createWrapper() });
    expect(screen.getByText("Account Details")).toBeInTheDocument();
  });


  it("shows spinner while loading", () => {
    (useAccountFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<Accounts />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Accounts />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });
});