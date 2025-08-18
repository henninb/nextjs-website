import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock router
jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Stub ResizeObserver used by some MUI internals
beforeAll(() => {
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock MUI DataGrid to keep DOM simple and stable in tests
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => (
    <div data-testid="mocked-datagrid">
      {rows.map((row: any, idx: number) => (
        <div key={idx} data-testid={`row-${idx}`}>
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

// Mock auth
jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

// Mock data hooks used by the page
jest.mock("../../../hooks/useAccountFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../hooks/useTotalsFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const insertAccountMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useAccountInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: insertAccountMock }),
}));
jest.mock("../../../hooks/useAccountUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
const deleteAccountMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useAccountDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: deleteAccountMock }),
}));

import AccountsPage from "../../../pages/finance/index";
import useAccountFetchMock from "../../../hooks/useAccountFetch";
import useTotalsFetchMock from "../../../hooks/useTotalsFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

describe("pages/finance/index (Accounts)", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUseAccountFetch = useAccountFetchMock as unknown as jest.Mock;
  const mockUseTotalsFetch = useTotalsFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state while fetching or auth is loading", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: true });
    mockUseAccountFetch.mockReturnValue({
      data: [],
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });
    mockUseTotalsFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);
    expect(
      screen.getByText(/Loading accounts and totals/i),
    ).toBeInTheDocument();
  });

  it("renders error display and retry when a hook errors", () => {
    const refetchAccounts = jest.fn();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isFetching: false,
      error: new Error("boom"),
      refetch: refetchAccounts,
    });
    mockUseTotalsFetch.mockReturnValue({
      data: { totals: 0, totalsCleared: 0, totalsOutstanding: 0, totalsFuture: 0 },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);

    // ErrorDisplay in card mode renders a Try Again button
    const tryAgain = screen.getByRole("button", { name: /try again/i });
    expect(tryAgain).toBeInTheDocument();
    fireEvent.click(tryAgain);
    expect(refetchAccounts).toHaveBeenCalled();
  });

  it("renders totals table and opens Add Account modal", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [
        {
          accountId: 1,
          accountNameOwner: "Chase Checking",
          accountType: "debit",
          activeStatus: true,
          moniker: "Household",
          outstanding: 100,
          future: 50,
          cleared: 25,
          validationDate: new Date("2024-01-01"),
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseTotalsFetch.mockReturnValue({
      data: {
        totals: 175,
        totalsCleared: 25,
        totalsOutstanding: 100,
        totalsFuture: 50,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);

    // Totals row (values may also appear in grid cells); ensure present at least once
    expect(screen.getAllByText("$175.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$25.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0);
    expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);

    // Open the add modal
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    expect(screen.getByText(/Add New Account/i)).toBeInTheDocument();
  });

  it("adds a new account (happy path)", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [
        {
          accountId: 9,
          accountNameOwner: "Seed",
          accountType: "debit",
          activeStatus: true,
          moniker: "S",
          outstanding: 0,
          future: 0,
          cleared: 0,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseTotalsFetch.mockReturnValue({
      data: { totals: 0, totalsCleared: 0, totalsOutstanding: 0, totalsFuture: 0 },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    fireEvent.change(screen.getByLabelText(/account$/i), { target: { value: "New Account" } });
    fireEvent.change(screen.getByLabelText(/moniker/i), { target: { value: "House" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).toHaveBeenCalled();
    expect(await screen.findByText(/Account inserted successfully/i)).toBeInTheDocument();
  });

  it("shows error when add account fails", async () => {
    insertAccountMock.mockRejectedValueOnce(new Error("Boom"));
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [
        {
          accountId: 9,
          accountNameOwner: "Seed",
          accountType: "debit",
          activeStatus: true,
          moniker: "S",
          outstanding: 0,
          future: 0,
          cleared: 0,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseTotalsFetch.mockReturnValue({
      data: { totals: 0, totalsCleared: 0, totalsOutstanding: 0, totalsFuture: 0 },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    fireEvent.change(screen.getByLabelText(/account$/i), { target: { value: "A" } });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).toHaveBeenCalled();
    expect(await screen.findByText(/Add Account Boom/i)).toBeInTheDocument();
  });

  it("does not submit when Add Account form is empty", () => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    // Provide seed data to avoid EmptyState
    mockUseAccountFetch.mockReturnValue({
      data: [
        {
          accountId: 99,
          accountNameOwner: "Seed",
          accountType: "debit",
          activeStatus: true,
          moniker: "S",
          outstanding: 0,
          future: 0,
          cleared: 0,
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseTotalsFetch.mockReturnValue({
      data: { totals: 0, totalsCleared: 0, totalsOutstanding: 0, totalsFuture: 0 },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    // Without typing anything, clicking Add should not call insert
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).not.toHaveBeenCalled();
  });

  it("opens delete confirmation from actions and confirms", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseAccountFetch.mockReturnValue({
      data: [
        {
          accountId: 1,
          accountNameOwner: "Chase Checking",
          accountType: "debit",
          activeStatus: true,
          moniker: "Household",
          outstanding: 100,
          future: 50,
          cleared: 25,
          validationDate: new Date("2024-01-01"),
        },
      ],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });
    mockUseTotalsFetch.mockReturnValue({
      data: {
        totals: 175,
        totalsCleared: 25,
        totalsOutstanding: 100,
        totalsFuture: 50,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />);
    const actionsCell = screen.getByTestId("cell-0-actions");
    const delBtn = actionsCell.querySelector('button');
    if (!delBtn) throw new Error('Delete button not found');
    fireEvent.click(delBtn);

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(deleteAccountMock).toHaveBeenCalled();
  });
});
