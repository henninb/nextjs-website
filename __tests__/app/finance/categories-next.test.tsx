import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const mockReplace = jest.fn();
const mockRefetch = jest.fn();
const mockInsert = jest.fn();
const mockDelete = jest.fn();
const mockUpdate = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
}));

jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../hooks/useCategoryFetchGql", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../hooks/useCategoryInsertGql", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsert }),
}));

jest.mock("../../../hooks/useCategoryDeleteGql", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockDelete }),
}));

jest.mock("../../../hooks/useCategoryUpdateGql", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockUpdate }),
}));

jest.mock("../../../components/PageHeader", () => ({
  __esModule: true,
  default: ({ title, subtitle, actions }: any) => (
    <div>
      <h1>{title}</h1>
      <p>{subtitle}</p>
      <div>{actions}</div>
    </div>
  ),
}));

jest.mock("../../../components/DataGridBase", () => ({
  __esModule: true,
  default: ({ rows, columns, processRowUpdate }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any, index: number) => (
        <div key={row.categoryId ?? index} data-testid={`row-${index}`}>
          {columns.map((col: any, colIndex: number) => (
            <div key={colIndex}>
              {col.renderCell
                ? col.renderCell({ row, value: row[col.field] })
                : row[col.field]}
            </div>
          ))}
          <button
            onClick={() =>
              processRowUpdate(
                { ...row, categoryName: `${row.categoryName}-updated` },
                row,
              )
            }
          >
            Update Row
          </button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("../../../components/ConfirmDialog", () => ({
  __esModule: true,
  default: ({ open, title, message, onConfirm, onClose }: any) =>
    open ? (
      <div data-testid="confirm-dialog">
        <div>{title}</div>
        <div>{message}</div>
        <button onClick={onConfirm}>Confirm Delete</button>
        <button onClick={onClose}>Close Delete</button>
      </div>
    ) : null,
}));

jest.mock("../../../components/FormDialog", () => ({
  __esModule: true,
  default: ({ open, title, children, onSubmit, onClose, submitText }: any) =>
    open ? (
      <div data-testid="form-dialog">
        <div>{title}</div>
        {children}
        <button onClick={onSubmit}>{submitText}</button>
        <button onClick={onClose}>Close Form</button>
      </div>
    ) : null,
}));

jest.mock("../../../components/LoadingState", () => ({
  __esModule: true,
  default: ({ message }: any) => <div>{message}</div>,
}));

jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, actionLabel, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      <button onClick={onAction}>{actionLabel}</button>
      <button onClick={onRefresh}>Refresh</button>
    </div>
  ),
}));

jest.mock("../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ onRetry }: any) => (
    <div data-testid="error-display">
      <button onClick={onRetry}>Retry Categories</button>
    </div>
  ),
}));

jest.mock("../../../components/SnackbarBaseline", () => ({
  __esModule: true,
  default: ({ message, state, severity }: any) =>
    state ? (
      <div data-testid="snackbar">
        {severity}:{message}
      </div>
    ) : null,
}));

jest.mock("../../../components/StatCard", () => ({
  __esModule: true,
  default: ({ label, value }: any) => (
    <div>
      {label}:{value}
    </div>
  ),
}));

jest.mock("../../../components/StatCardSkeleton", () => ({
  __esModule: true,
  default: () => <div>stat-skeleton</div>,
}));

jest.mock("../../../components/ViewToggle", () => ({
  __esModule: true,
  default: ({ onChange }: any) => (
    <div>
      <button onClick={() => onChange("table")}>Table View</button>
      <button onClick={() => onChange("grid")}>Grid View</button>
    </div>
  ),
}));

jest.mock("../../../components/CategoryFilterBar", () => ({
  __esModule: true,
  default: ({
    resultCount,
    totalCount,
    onSearchChange,
    onFilterChange,
    onClearFilters,
  }: any) => (
    <div>
      <div>
        results:{resultCount}/{totalCount}
      </div>
      <button onClick={() => onSearchChange("zzz")}>Search Missing</button>
      <button
        onClick={() => onFilterChange({ status: "inactive", usage: "all" })}
      >
        Inactive Filter
      </button>
      <button
        onClick={() => onFilterChange({ status: "all", usage: "unused" })}
      >
        Unused Filter
      </button>
      <button onClick={onClearFilters}>Clear Filters</button>
    </div>
  ),
}));

jest.mock("../../../components/CategoryCard", () => ({
  __esModule: true,
  default: ({ category, onDelete }: any) => (
    <div data-testid={`category-card-${category.categoryName}`}>
      <span>{category.categoryName}</span>
      <button onClick={() => onDelete(category)}>Delete Card</button>
    </div>
  ),
}));

jest.mock("../../../components/CategoryCardSkeleton", () => ({
  __esModule: true,
  default: () => <div>card-skeleton</div>,
}));

import CategoriesNextGen from "../../../app/finance/categories-next/page";
import useCategoryFetchGql from "../../../hooks/useCategoryFetchGql";
import { useAuth } from "../../../components/AuthProvider";

const mockCategories = [
  {
    categoryId: 1,
    categoryName: "groceries",
    activeStatus: true,
    categoryCount: 2,
  },
  {
    categoryId: 2,
    categoryName: "unused_category",
    activeStatus: false,
    categoryCount: 0,
  },
];

describe("app/finance/categories-next/page", () => {
  const authMock = useAuth as jest.Mock;
  const fetchMock = useCategoryFetchGql as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    authMock.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchMock.mockReturnValue({
      data: mockCategories,
      isSuccess: true,
      isFetching: false,
      isError: false,
      error: null,
      refetch: mockRefetch,
    });
    mockInsert.mockResolvedValue({});
    mockDelete.mockResolvedValue({});
    mockUpdate.mockResolvedValue({});
  });

  it("redirects to login when authentication is missing", () => {
    authMock.mockReturnValue({ isAuthenticated: false, loading: false });

    render(<CategoriesNextGen />);

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.getByText("Loading categories...")).toBeInTheDocument();
  });

  it("renders error state and retries fetch", () => {
    fetchMock.mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      isError: true,
      error: new Error("boom"),
      refetch: mockRefetch,
    });

    render(<CategoriesNextGen />);
    fireEvent.click(screen.getByText("Retry Categories"));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders grid view stats and deletes a category from a card", async () => {
    localStorage.setItem("categoryView", "grid");

    render(<CategoriesNextGen />);

    expect(screen.getByText("Total:2")).toBeInTheDocument();
    expect(screen.getByText("Active:1")).toBeInTheDocument();
    expect(screen.getByText("Inactive:1")).toBeInTheDocument();
    expect(screen.getByText("Not Used:1")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete Card")[0]);
    fireEvent.click(screen.getByText("Confirm Delete"));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith(mockCategories[0]));
  });

  it("updates a category from table view and reports failures", async () => {
    localStorage.setItem("categoryView", "table");
    mockUpdate.mockRejectedValueOnce(new Error("update failed"));

    render(<CategoriesNextGen />);

    fireEvent.click(screen.getAllByText("Update Row")[0]);

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("snackbar")).toHaveTextContent(
      "error:Update Category failure.: update failed",
    );
  });

  it("shows validation errors when adding an empty category", async () => {
    render(<CategoriesNextGen />);

    fireEvent.click(screen.getByText("Add Category"));
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(screen.getByText("Name is required")).toBeInTheDocument(),
    );
    expect(mockInsert).not.toHaveBeenCalled();
    expect(screen.getByTestId("snackbar")).toHaveTextContent(
      "error:Name is required",
    );
  });

  it("loads cached draft data and saves a new category", async () => {
    localStorage.setItem("finance_cache_enabled_categories_next", "true");
    localStorage.setItem(
      "finance_cached_data_categories_next",
      JSON.stringify({
        categoryId: 99,
        categoryName: "cached_category",
        activeStatus: "true",
      }),
    );

    render(<CategoriesNextGen />);

    fireEvent.click(screen.getByText("Add Category"));
    expect(screen.getByDisplayValue("cached_category")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(mockInsert).toHaveBeenCalledWith({
        category: {
          categoryId: 99,
          categoryName: "cached_category",
          activeStatus: true,
        },
      }),
    );
    expect(localStorage.getItem("finance_cached_data_categories_next")).toBe(
      JSON.stringify({
        categoryId: 99,
        categoryName: "cached_category",
        activeStatus: true,
      }),
    );
  });

  it("filters to empty state and clears filters back to results", () => {
    render(<CategoriesNextGen />);

    fireEvent.click(screen.getByText("Search Missing"));
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getAllByText("Clear Filters")).toHaveLength(2);

    fireEvent.click(screen.getAllByText("Clear Filters")[1]);
    expect(screen.getByText("results:2/2")).toBeInTheDocument();
  });

  it("toggles cache preference off and clears persisted cache", () => {
    localStorage.setItem("finance_cache_enabled_categories_next", "true");
    localStorage.setItem(
      "finance_cached_data_categories_next",
      JSON.stringify({ categoryName: "draft" }),
    );

    render(<CategoriesNextGen />);
    fireEvent.click(screen.getByText("Add Category"));
    fireEvent.click(screen.getByRole("checkbox"));

    expect(localStorage.getItem("finance_cache_enabled_categories_next")).toBe(
      "false",
    );
    expect(localStorage.getItem("finance_cached_data_categories_next")).toBeNull();
  });
});
