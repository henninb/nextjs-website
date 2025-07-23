import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Configuration from "../../../pages/finance/configuration";
import * as useParameterFetch from "../../../hooks/useParameterFetch";
import * as useParameterInsert from "../../../hooks/useParameterInsert";
import * as useParameterDelete from "../../../hooks/useParameterDelete";
import * as useParameterUpdate from "../../../hooks/useParameterUpdate";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useParameterFetch");
jest.mock("../../../hooks/useParameterInsert");
jest.mock("../../../hooks/useParameterDelete");
jest.mock("../../../hooks/useParameterUpdate");
jest.mock("../../../components/AuthProvider");

const mockParameterData = [
  {
    parameterId: 1,
    parameterName: "payment_account",
    parameterValue: "Checking Account",
  },
  {
    parameterId: 2,
    parameterName: "default_category",
    parameterValue: "Miscellaneous",
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

describe("Configuration Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useParameterFetch.default as jest.Mock).mockReturnValue({
      data: mockParameterData,
      isSuccess: true,
      isLoading: false,
      error: null,
    });

    (useParameterInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useParameterUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useParameterDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders configuration details heading", () => {
    render(<Configuration />, { wrapper: createWrapper() });
    expect(screen.getByText("Configuration Details")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Configuration />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useParameterFetch.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: true,
      error: null,
    });

    render(<Configuration />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

});