import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock MUI DataGrid to render simple DOM for interactions
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="data-grid">
      {rows.map((row: any, rIdx: number) => (
        <div key={rIdx}>
          {columns.map((col: any, cIdx: number) =>
            col.renderCell ? (
              <div
                key={cIdx}
                data-testid={`cell-${rIdx}-${String(
                  col.headerName || col.field,
                ).toLowerCase()}`}
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

// Module paths
import * as AuthProvider from "../../../components/AuthProvider";
import ConfigurationNextGen from "../../../pages/finance/configuration-next";
import * as useParameterFetchGql from "../../../hooks/useParameterFetchGql";
import * as useParameterInsertGql from "../../../hooks/useParameterInsertGql";
import * as useParameterDeleteGql from "../../../hooks/useParameterDeleteGql";
import * as useParameterUpdateGql from "../../../hooks/useParameterUpdateGql";

jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn() }),
}));

// Mock EmptyState and ErrorDisplay
jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && (
        <button onClick={onAction} data-testid="empty-action">
          Add Parameter
        </button>
      )}
      {onRefresh && (
        <button onClick={onRefresh} data-testid="empty-refresh">
          Refresh
        </button>
      )}
    </div>
  ),
}));

jest.mock("../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ onRetry }: { onRetry?: () => void }) => (
    <div data-testid="error-display">
      <div>An unexpected error occurred. Please try again.</div>
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Try Again
        </button>
      )}
    </div>
  ),
}));

jest.mock("../../../hooks/useParameterFetchGql");
jest.mock("../../../hooks/useParameterInsertGql");
jest.mock("../../../hooks/useParameterDeleteGql");
jest.mock("../../../hooks/useParameterUpdateGql");
jest.mock("../../../components/AuthProvider");

const mockParameters = [
  {
    parameterId: 1,
    parameterName: "currency",
    parameterValue: "USD",
    activeStatus: true,
  },
];

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("ConfigurationNextGen page", () => {
  beforeEach(() => {
    (AuthProvider.useAuth as jest.Mock).mockReturnValue({
      isAuthenticated: true,
      loading: false,
    });

    (useParameterFetchGql.default as jest.Mock).mockReturnValue({
      data: mockParameters,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    (useParameterInsertGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });

    (useParameterDeleteGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({ ok: true }),
    });

    (useParameterUpdateGql.default as jest.Mock).mockReturnValue({
      mutateAsync: jest.fn(),
    });
  });

  it("renders the page header", () => {
    render(<ConfigurationNextGen />, { wrapper: createWrapper() });
    expect(
      screen.getByText(/System Configuration \(Next‑Gen\)/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/GraphQL-powered configuration parameters/i),
    ).toBeInTheDocument();
  });

  it("shows spinner while loading", () => {
    (useParameterFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationNextGen />, { wrapper: createWrapper() });
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(
      screen.getByText("Loading configuration parameters..."),
    ).toBeInTheDocument();
  });

  it("renders empty state when there are no parameters", () => {
    (useParameterFetchGql.default as jest.Mock).mockReturnValue({
      data: [],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationNextGen />, { wrapper: createWrapper() });
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No Parameters Found/i)).toBeInTheDocument();
  });

  it("opens Add Parameter dialog and submits insert mutation", () => {
    const mockInsert = jest.fn().mockResolvedValue({});
    (useParameterInsertGql.default as jest.Mock).mockReturnValue({
      mutateAsync: mockInsert,
    });

    render(<ConfigurationNextGen />, { wrapper: createWrapper() });

    // Click the page-level Add Parameter button
    const addButton = screen.getByText("Add Parameter");
    fireEvent.click(addButton);

    // Fill inputs
    const nameInput = screen.getByLabelText(/Name/i);
    const valueInput = screen.getByLabelText(/Value/i);
    fireEvent.change(nameInput, { target: { value: "default_category" } });
    fireEvent.change(valueInput, { target: { value: "groceries" } });

    // Submit dialog
    const submitButtons = screen.getAllByRole("button");
    const submit = submitButtons.find((b) =>
      /Add|Save/.test(b.textContent || ""),
    );
    if (!submit) throw new Error("Submit button not found");
    fireEvent.click(submit);

    expect(mockInsert).toHaveBeenCalled();
  });

  it("shows ErrorDisplay and triggers refetch on retry", () => {
    const refetchParameters = jest.fn();

    (useParameterFetchGql.default as jest.Mock).mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom parameters"),
      refetch: refetchParameters,
    });

    render(<ConfigurationNextGen />, { wrapper: createWrapper() });
    expect(screen.getByTestId("error-display")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("retry-button"));
    expect(refetchParameters).toHaveBeenCalledTimes(1);
  });
});
