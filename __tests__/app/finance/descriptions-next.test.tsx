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

jest.mock("../../../hooks/useDescriptionFetchGql", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../hooks/useDescriptionInsertGql", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockInsert }),
}));

jest.mock("../../../hooks/useDescriptionDeleteGql", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mockDelete }),
}));

jest.mock("../../../hooks/useDescriptionUpdateGql", () => ({
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
        <div key={row.descriptionId ?? index} data-testid={`row-${index}`}>
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
                { ...row, descriptionName: `${row.descriptionName}-updated` },
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
      <button onClick={onRetry}>Retry Descriptions</button>
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

jest.mock("../../../components/DescriptionFilterBar", () => ({
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

jest.mock("../../../components/DescriptionCard", () => ({
  __esModule: true,
  default: ({ description, onDelete }: any) => (
    <div data-testid={`description-card-${description.descriptionName}`}>
      <span>{description.descriptionName}</span>
      <button onClick={() => onDelete(description)}>Delete Card</button>
    </div>
  ),
}));

jest.mock("../../../components/DescriptionCardSkeleton", () => ({
  __esModule: true,
  default: () => <div>card-skeleton</div>,
}));

import DescriptionsNextGen from "../../../app/finance/descriptions-next/page";
import useDescriptionFetchGql from "../../../hooks/useDescriptionFetchGql";
import { useAuth } from "../../../components/AuthProvider";

const mockDescriptions = [
  {
    descriptionId: 1,
    descriptionName: "merchant_one",
    activeStatus: true,
    descriptionCount: 4,
  },
  {
    descriptionId: 2,
    descriptionName: "unused_description",
    activeStatus: false,
    descriptionCount: 0,
  },
];

describe("app/finance/descriptions-next/page", () => {
  const authMock = useAuth as jest.Mock;
  const fetchMock = useDescriptionFetchGql as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    authMock.mockReturnValue({ isAuthenticated: true, loading: false });
    fetchMock.mockReturnValue({
      data: mockDescriptions,
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

  it("redirects to login when unauthenticated", () => {
    authMock.mockReturnValue({ isAuthenticated: false, loading: false });

    render(<DescriptionsNextGen />);

    expect(mockReplace).toHaveBeenCalledWith("/login");
    expect(screen.getByText("Loading descriptions...")).toBeInTheDocument();
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

    render(<DescriptionsNextGen />);
    fireEvent.click(screen.getByText("Retry Descriptions"));

    expect(mockRefetch).toHaveBeenCalledTimes(1);
  });

  it("renders grid view stats and deletes a description from a card", async () => {
    localStorage.setItem("descriptionView", "grid");

    render(<DescriptionsNextGen />);

    expect(screen.getByText("Total:2")).toBeInTheDocument();
    expect(screen.getByText("Active:1")).toBeInTheDocument();
    expect(screen.getByText("Inactive:1")).toBeInTheDocument();
    expect(screen.getByText("Not Used:1")).toBeInTheDocument();

    fireEvent.click(screen.getAllByText("Delete Card")[0]);
    fireEvent.click(screen.getByText("Confirm Delete"));

    await waitFor(() =>
      expect(mockDelete).toHaveBeenCalledWith(mockDescriptions[0]),
    );
  });

  it("updates a description from table view and reports failures", async () => {
    localStorage.setItem("descriptionView", "table");
    mockUpdate.mockRejectedValueOnce(new Error("update failed"));

    render(<DescriptionsNextGen />);

    fireEvent.click(screen.getAllByText("Update Row")[0]);

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("snackbar")).toHaveTextContent(
      "error:Update Description failure.: update failed",
    );
  });

  it("shows validation errors when adding an empty description", async () => {
    render(<DescriptionsNextGen />);

    fireEvent.click(screen.getByText("Add Description"));
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(screen.getByText("Name is required")).toBeInTheDocument(),
    );
    expect(mockInsert).not.toHaveBeenCalled();
    expect(screen.getByTestId("snackbar")).toHaveTextContent(
      "error:Name is required",
    );
  });

  it("loads cached draft data and saves a new description", async () => {
    localStorage.setItem("finance_cache_enabled_descriptions_next", "true");
    localStorage.setItem(
      "finance_cached_data_descriptions_next",
      JSON.stringify({
        descriptionId: 99,
        descriptionName: "cached_description",
        activeStatus: "false",
      }),
    );

    render(<DescriptionsNextGen />);

    fireEvent.click(screen.getByText("Add Description"));
    expect(screen.getByDisplayValue("cached_description")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Add"));

    await waitFor(() =>
      expect(mockInsert).toHaveBeenCalledWith({
        description: {
          descriptionId: 99,
          descriptionName: "cached_description",
          activeStatus: false,
        },
      }),
    );
    expect(localStorage.getItem("finance_cached_data_descriptions_next")).toBe(
      JSON.stringify({
        descriptionId: 99,
        descriptionName: "cached_description",
        activeStatus: false,
      }),
    );
  });

  it("filters to empty state and clears filters back to results", () => {
    render(<DescriptionsNextGen />);

    fireEvent.click(screen.getByText("Search Missing"));
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getAllByText("Clear Filters")).toHaveLength(2);

    fireEvent.click(screen.getAllByText("Clear Filters")[1]);
    expect(screen.getByText("results:2/2")).toBeInTheDocument();
  });

  it("toggles cache preference off and clears persisted cache", () => {
    localStorage.setItem("finance_cache_enabled_descriptions_next", "true");
    localStorage.setItem(
      "finance_cached_data_descriptions_next",
      JSON.stringify({ descriptionName: "draft" }),
    );

    render(<DescriptionsNextGen />);
    fireEvent.click(screen.getByText("Add Description"));
    fireEvent.click(screen.getByRole("checkbox"));

    expect(
      localStorage.getItem("finance_cache_enabled_descriptions_next"),
    ).toBe("false");
    expect(
      localStorage.getItem("finance_cached_data_descriptions_next"),
    ).toBeNull();
  });
});
