import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Categories from "../../../pages/finance/categories";
import * as useFetchCategory from "../../../hooks/useCategoryFetch";
import * as useCategoryInsert from "../../../hooks/useCategoryInsert";
import * as useCategoryDelete from "../../../hooks/useCategoryDelete";
import * as useCategoryUpdate from "../../../hooks/useCategoryUpdate";
import * as AuthProvider from "../../../components/AuthProvider";

jest.mock("next/router", () => ({
  useRouter: () => ({
    replace: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useCategoryFetch");
jest.mock("../../../hooks/useCategoryInsert");
jest.mock("../../../hooks/useCategoryDelete");
jest.mock("../../../hooks/useCategoryUpdate");
jest.mock("../../../components/AuthProvider");

const mockCategoryData = [
  {
    categoryId: 1,
    categoryName: "Food",
    activeStatus: "active",
  },
  {
    categoryId: 2,
    categoryName: "Transportation",
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

describe("Categories Component", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useFetchCategory.default as jest.Mock).mockReturnValue({
      data: mockCategoryData,
      isSuccess: true,
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    });

    (useCategoryInsert.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useCategoryUpdate.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useCategoryDelete.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders category details heading", () => {
    render(<Categories />, { wrapper: createWrapper() });
    expect(screen.getByText("Category Details")).toBeInTheDocument();
  });

  it("renders data grid component", () => {
    render(<Categories />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useFetchCategory.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: true,
      isError: false,
      refetch: jest.fn(),
    });

    render(<Categories />, { wrapper: createWrapper() });

    expect(screen.getByTestId("loader")).toBeInTheDocument();
  });

  it("shows error state with retry button", () => {
    const mockRefetch = jest.fn();
    (useFetchCategory.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: false,
      isError: true,
      refetch: mockRefetch,
    });

    render(<Categories />, { wrapper: createWrapper() });

    expect(
      screen.getByText(
        "Failed to load categories. Please check your connection.",
      ),
    ).toBeInTheDocument();

    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it("renders data grid component", () => {
    render(<Categories />, { wrapper: createWrapper() });

    expect(screen.getByTestId("data-grid")).toBeInTheDocument();
  });
});
