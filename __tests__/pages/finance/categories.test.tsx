import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

beforeAll(() => {
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="mocked-datagrid">
      {rows.map((row: any, idx: number) => (
        <div key={idx}>
          {columns.map((col: any, cidx: number) =>
            col.renderCell ? (
              <div
                key={cidx}
                data-testid={`cell-${idx}-${String(col.headerName || col.field).toLowerCase()}`}
              >
                {col.renderCell({ row, value: row[col.field] })}
              </div>
            ) : null,
          )}
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../hooks/useCategoryFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const insertCategoryMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useCategoryInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: insertCategoryMock }),
}));
const deleteCategoryMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useCategoryDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: deleteCategoryMock }),
}));
jest.mock("../../../hooks/useCategoryUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

import CategoriesPage from "../../../pages/finance/categories";
import useCategoryFetchMock from "../../../hooks/useCategoryFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

describe("pages/finance/categories", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUseCategoryFetch = useCategoryFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseCategoryFetch.mockReturnValue({
      data: [],
      isSuccess: false,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });
    render(<CategoriesPage />);
    expect(screen.getByText(/Loading categories/i)).toBeInTheDocument();
  });

  it("shows error and retries", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    const refetch = jest.fn();
    mockUseCategoryFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
      refetch,
    });

    render(<CategoriesPage />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("opens Add Category modal", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseCategoryFetch.mockReturnValue({
      data: [
        { categoryId: 1, categoryName: "Groceries", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<CategoriesPage />);
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    expect(screen.getByText(/Add New Category/i)).toBeInTheDocument();
  });

  it("adds a new category (happy path)", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseCategoryFetch.mockReturnValue({
      data: [
        { categoryId: 2, categoryName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<CategoriesPage />);
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "Groceries" } });
    fireEvent.change(screen.getByLabelText(/status/i), { target: { value: "true" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertCategoryMock).toHaveBeenCalled();
    expect(await screen.findByText(/Category inserted successfully/i)).toBeInTheDocument();
  });

  it("shows error when add category fails", async () => {
    insertCategoryMock.mockRejectedValueOnce(new Error("Boom"));
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseCategoryFetch.mockReturnValue({
      data: [
        { categoryId: 2, categoryName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<CategoriesPage />);
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: "G" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertCategoryMock).toHaveBeenCalled();
    expect(await screen.findByText(/Add Category error: Boom/i)).toBeInTheDocument();
  });

  it("does not submit when Add Category form is empty", () => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseCategoryFetch.mockReturnValue({
      data: [
        { categoryId: 2, categoryName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<CategoriesPage />);
    fireEvent.click(screen.getByRole("button", { name: /add category/i }));
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertCategoryMock).not.toHaveBeenCalled();
  });

  it("opens delete confirmation from actions and confirms", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseCategoryFetch.mockReturnValue({
      data: [
        { categoryId: 1, categoryName: "Groceries", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<CategoriesPage />);
    const actionsCell = screen.getByTestId("cell-0-actions");
    const delBtn = actionsCell.querySelector('button');
    if (!delBtn) throw new Error('Delete button not found');
    fireEvent.click(delBtn);
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(deleteCategoryMock).toHaveBeenCalled();
  });
});
