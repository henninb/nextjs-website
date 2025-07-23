import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Descriptions from "../../../pages/finance/descriptions";
import * as useFetchDescription from "../../../hooks/useDescriptionFetch";
import * as useDescriptionInsert from "../../../hooks/useDescriptionInsert";
import * as useDescriptionDelete from "../../../hooks/useDescriptionDelete";
import * as useDescriptionUpdate from "../../../hooks/useDescriptionUpdate";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useDescriptionFetch");
jest.mock("../../../hooks/useDescriptionInsert");
jest.mock("../../../hooks/useDescriptionDelete");
jest.mock("../../../hooks/useDescriptionUpdate");
jest.mock("../../../components/AuthProvider");

const mockDescriptionData = [
  {
    descriptionId: 1,
    description: "Grocery Store",
    activeStatus: "active",
  },
  {
    descriptionId: 2,
    description: "Gas Station",
    activeStatus: "active",
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

describe("Descriptions Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useFetchDescription.default as jest.Mock).mockReturnValue({
      data: mockDescriptionData,
      isSuccess: true,
      isFetching: false,
      error: null,
    });

    (useDescriptionInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useDescriptionUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useDescriptionDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders description details heading", () => {
    render(<Descriptions />, { wrapper: createWrapper() });
    expect(screen.getByText("Description Details")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Descriptions />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useFetchDescription.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
    });

    render(<Descriptions />, { wrapper: createWrapper() });
    
    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

});