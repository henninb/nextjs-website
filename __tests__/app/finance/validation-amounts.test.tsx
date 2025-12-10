import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

beforeAll(() => {
  // @ts-expect-error - jsdom lacks ResizeObserver; mock for MUI
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

jest.mock("../../../hooks/useValidationAmountsFetchAll", () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock("../../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const insertValidationAmountMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useValidationAmountInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: insertValidationAmountMock }),
}));

const deleteValidationAmountMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useValidationAmountDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: deleteValidationAmountMock }),
}));

jest.mock("../../../hooks/useValidationAmountUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, actionLabel, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      {title && <h3>{title}</h3>}
      {message && <p>{message}</p>}
      {actionLabel && onAction && (
        <button onClick={onAction}>{actionLabel}</button>
      )}
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  ),
}));

jest.mock("../../../components/LoadingState", () => ({
  __esModule: true,
  default: ({ message }: any) => <div>{message}</div>,
}));

jest.mock("../../../components/ErrorDisplay", () => ({
  __esModule: true,
  default: ({ error, onRetry }: any) => (
    <div>
      <div>Error: {error.message}</div>
      {onRetry && <button onClick={onRetry}>Try again</button>}
    </div>
  ),
}));

import ValidationAmountsPage from "../../../app/finance/validation-amounts/page";
import useValidationAmountsFetchAllMock from "../../../hooks/useValidationAmountsFetchAll";
import useAccountFetchMock from "../../../hooks/useAccountFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

describe("pages/finance/validation-amounts", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUseValidationAmountsFetchAll =
    useValidationAmountsFetchAllMock as unknown as jest.Mock;
  const mockUseAccountFetch = useAccountFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows account selection prompt when no account selected", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [
        { accountNameOwner: "checking_brian", accountId: 1 },
        { accountNameOwner: "savings_brian", accountId: 2 },
      ],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [],
      isSuccess: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);
    expect(
      screen.getByText(/Please select an account from the dropdown above/i),
    ).toBeInTheDocument();
  });

  it("shows loading state when fetching validation amounts", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [],
      isSuccess: false,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    // Select an account first
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    const option = screen.getByText("checking_brian");
    fireEvent.click(option);

    expect(screen.getByText(/Loading validation amounts/i)).toBeInTheDocument();
  });

  it("shows error and retries", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    const refetch = jest.fn();
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
      refetch,
    });

    render(<ValidationAmountsPage />);

    // Select account
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText("checking_brian"));

    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("opens Add Validation Amount modal", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [
        {
          validationId: 1,
          validationDate: new Date("2024-01-01"),
          amount: 1000.0,
          transactionState: "cleared",
          activeStatus: true,
        },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    // Select account
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText("checking_brian"));

    const addButtons = screen.getAllByRole("button", {
      name: /add validation amount/i,
    });
    fireEvent.click(addButtons[0]);
    expect(
      screen.getByRole("heading", { name: /Add Validation Amount/i }),
    ).toBeInTheDocument();
  });

  it("adds a new validation amount (happy path)", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    // Select account
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText("checking_brian"));

    const addButtons = screen.getAllByRole("button", {
      name: /add validation amount/i,
    });
    fireEvent.click(addButtons[0]);

    // Fill in form
    const dateInput = screen.getByLabelText(/validation date/i);
    fireEvent.change(dateInput, { target: { value: "2024-01-01" } });

    const amountInput = screen.getByLabelText(/^amount$/i);
    fireEvent.change(amountInput, { target: { value: "1000.00" } });

    // Submit form
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    await waitFor(() => {
      expect(insertValidationAmountMock).toHaveBeenCalled();
    });

    expect(
      await screen.findByText(/Validation amount added successfully/i),
    ).toBeInTheDocument();
  });

  it("shows empty state when no validation amounts exist for account", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    // Select account
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText("checking_brian"));

    expect(
      screen.getByText(/No validation amounts found for account/i),
    ).toBeInTheDocument();
  });

  it("displays validation amounts in grid when data exists", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [
        {
          validationId: 1,
          validationDate: new Date("2024-01-01"),
          amount: 1000.0,
          transactionState: "cleared",
          activeStatus: true,
          dateAdded: new Date("2024-01-01"),
          dateUpdated: new Date("2024-01-01"),
        },
        {
          validationId: 2,
          validationDate: new Date("2024-02-01"),
          amount: 2000.0,
          transactionState: "outstanding",
          activeStatus: true,
          dateAdded: new Date("2024-02-01"),
          dateUpdated: new Date("2024-02-01"),
        },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    // Select account
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText("checking_brian"));

    expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
  });

  it("disables Add button when no account is selected", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [],
      isSuccess: false,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    const addButton = screen.getByRole("button", {
      name: /add validation amount/i,
    });
    expect(addButton).toBeDisabled();
  });

  it("opens delete confirmation dialog", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [{ accountNameOwner: "checking_brian", accountId: 1 }],
      isLoading: false,
    });
    mockUseValidationAmountsFetchAll.mockReturnValue({
      data: [
        {
          validationId: 1,
          validationDate: new Date("2024-01-01"),
          amount: 1000.0,
          transactionState: "cleared",
          activeStatus: true,
        },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ValidationAmountsPage />);

    // Select account
    const accountSelect = screen.getByLabelText(/select account/i);
    fireEvent.mouseDown(accountSelect);
    fireEvent.click(screen.getByText("checking_brian"));

    // Find and click delete button
    const deleteButton = screen.getByLabelText(/delete this row/i);
    fireEvent.click(deleteButton);

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
  });
});
