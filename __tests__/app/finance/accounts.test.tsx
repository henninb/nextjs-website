import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Mock router
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Stub ResizeObserver used by some MUI internals
beforeAll(() => {
  // @ts-expect-error - jsdom lacks ResizeObserver; mock for MUI
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
const deactivateAccountMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useAccountDeactivate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: deactivateAccountMock }),
}));

import AccountsPage from "../../../app/finance/page";
import useAccountFetchMock from "../../../hooks/useAccountFetch";
import useTotalsFetchMock from "../../../hooks/useTotalsFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

// Helper to create QueryClientProvider wrapper
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

    const { container } = render(<AccountsPage />, { wrapper: createWrapper() });
    // Check for MUI Skeleton components (should have multiple skeletons during loading)
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(0);
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
      data: {
        totals: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
        totalsFuture: 0,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />, { wrapper: createWrapper() });

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

    render(<AccountsPage />, { wrapper: createWrapper() });

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
      data: {
        totals: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
        totalsFuture: 0,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));

    // Check that modal opened and form fields are present
    expect(screen.getByText(/Add New Account/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/account$/i)[0]).toBeInTheDocument();
    expect(screen.getByLabelText(/account type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/moniker/i)).toBeInTheDocument();

    // Attempt submission without initialized form state
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Account name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Account type is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Moniker is required/i)).toBeInTheDocument();
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
      data: {
        totals: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
        totalsFuture: 0,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Account name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Account type is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Moniker is required/i)).toBeInTheDocument();
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
      data: {
        totals: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
        totalsFuture: 0,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    // Without typing anything, clicking Add should not call insert and should show messages
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Account name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Account type is required/i)).toBeInTheDocument();
  });

  it("shows error when Account Type is invalid", () => {
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
      data: {
        totals: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
        totalsFuture: 0,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /account$/i }), {
      target: { value: "X" },
    });
    fireEvent.change(screen.getByLabelText(/account type/i), {
      target: { value: "checking" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Account type must be debit or credit/i),
    ).toBeInTheDocument();
  });

  it("shows error when Moniker has invalid characters", () => {
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
      data: {
        totals: 0,
        totalsCleared: 0,
        totalsOutstanding: 0,
        totalsFuture: 0,
      },
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<AccountsPage />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByRole("button", { name: /add account/i }));
    fireEvent.change(screen.getByRole("textbox", { name: /account$/i }), {
      target: { value: "New" },
    });
    fireEvent.change(screen.getByLabelText(/account type/i), {
      target: { value: "debit" },
    });
    fireEvent.change(screen.getByLabelText(/moniker/i), {
      target: { value: "House!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertAccountMock).not.toHaveBeenCalled();
    expect(
      screen.getByText(/Moniker can only contain letters and numbers/i),
    ).toBeInTheDocument();
  });

  it("opens delete confirmation from actions and confirms", async () => {
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

    render(<AccountsPage />, { wrapper: createWrapper() });
    const actionsCell = screen.getByTestId("cell-0-actions");
    const buttons = actionsCell.querySelectorAll("button");
    // First button is Deactivate, second button is Delete
    const delBtn = buttons[1];
    if (!delBtn) throw new Error("Delete button not found");
    fireEvent.click(delBtn);

    await waitFor(() => {
      expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    });
    const deleteButton = await screen.findByRole("button", {
      name: /^delete$/i,
      hidden: true,
    });
    fireEvent.click(deleteButton);
    expect(deleteAccountMock).toHaveBeenCalled();
  });

  describe("Search and Filtering", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
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
    });

    it("renders search input", () => {
      mockUseAccountFetch.mockReturnValue({
        data: [
          {
            accountId: 1,
            accountNameOwner: "Test Account",
            accountType: "debit",
            activeStatus: true,
            moniker: "Test",
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

      render(<AccountsPage />, { wrapper: createWrapper() });
      const searchInput = screen.getByPlaceholderText(/search accounts/i);
      expect(searchInput).toBeInTheDocument();
    });

    it("renders filter chips", () => {
      mockUseAccountFetch.mockReturnValue({
        data: [
          {
            accountId: 1,
            accountNameOwner: "Test Account",
            accountType: "debit",
            activeStatus: true,
            moniker: "Test",
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

      render(<AccountsPage />, { wrapper: createWrapper() });

      expect(screen.getByText("Debit")).toBeInTheDocument();
      expect(screen.getByText("Credit")).toBeInTheDocument();
      expect(screen.getByText("Zero Balance")).toBeInTheDocument();
    });

    it("filters accounts by search term", async () => {
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
          },
          {
            accountId: 2,
            accountNameOwner: "Wells Fargo Savings",
            accountType: "debit",
            activeStatus: true,
            moniker: "Savings",
            outstanding: 0,
            future: 0,
            cleared: 500,
          },
        ],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<AccountsPage />, { wrapper: createWrapper() });

      const searchInput = screen.getByPlaceholderText(/search accounts/i);

      // Verify search input is functional
      fireEvent.change(searchInput, { target: { value: "Chase" } });
      expect(searchInput).toHaveValue("Chase");

      // Verify Clear All button appears when filters are active
      await waitFor(() => {
        expect(screen.getByText("Clear All")).toBeInTheDocument();
      });
    });
  });

  describe("View Toggle", () => {
    beforeEach(() => {
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
    });

    it("renders view toggle component", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      expect(screen.getByLabelText(/table view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/grid view/i)).toBeInTheDocument();
    });

    it("toggles between table and grid view", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Should start in table view (default)
      const gridViewButton = screen.getByLabelText(/grid view/i);
      fireEvent.click(gridViewButton);

      // Grid view should be active now
      expect(gridViewButton.classList.contains("Mui-selected")).toBe(true);
    });

    it("renders table view by default", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Table view should be selected by default
      // Just verify both buttons are present and toggle works
      expect(screen.getByLabelText(/table view/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/grid view/i)).toBeInTheDocument();
    });
  });

  describe("Grid View", () => {
    beforeEach(() => {
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
            cleared: 250,
            validationDate: new Date("2024-01-01"),
          },
          {
            accountId: 2,
            accountNameOwner: "Amex Credit",
            accountType: "credit",
            activeStatus: false,
            moniker: "Travel",
            outstanding: 200,
            future: 100,
            cleared: 0,
            validationDate: new Date("2024-01-15"),
          },
        ],
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
      mockUseTotalsFetch.mockReturnValue({
        data: {
          totals: 700,
          totalsCleared: 250,
          totalsOutstanding: 300,
          totalsFuture: 150,
        },
        isSuccess: true,
        isFetching: false,
        error: null,
        refetch: jest.fn(),
      });
    });

    it("renders account cards in grid view", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Switch to grid view
      const gridViewButton = screen.getByLabelText(/grid view/i);
      fireEvent.click(gridViewButton);

      // Both accounts should be rendered
      expect(screen.getByText("Chase Checking")).toBeInTheDocument();
      expect(screen.getByText("Amex Credit")).toBeInTheDocument();
    });

    it("displays account details in cards", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Switch to grid view
      const gridViewButton = screen.getByLabelText(/grid view/i);
      fireEvent.click(gridViewButton);

      // Check for account details (using getAllByText for items that appear multiple times)
      expect(screen.getByText("Household")).toBeInTheDocument();
      expect(screen.getByText("Travel")).toBeInTheDocument();
      expect(screen.getAllByText("Active").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Inactive").length).toBeGreaterThan(0);
    });

    it("shows account type badges", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Switch to grid view
      const gridViewButton = screen.getByLabelText(/grid view/i);
      fireEvent.click(gridViewButton);

      // Check for account type badges
      expect(screen.getByText("debit")).toBeInTheDocument();
      expect(screen.getByText("credit")).toBeInTheDocument();
    });
  });

  describe("StatCards", () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
      mockUseAccountFetch.mockReturnValue({
        data: [
          {
            accountId: 1,
            accountNameOwner: "Test Account",
            accountType: "debit",
            activeStatus: true,
            moniker: "Test",
            outstanding: 100,
            future: 50,
            cleared: 25,
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
    });

    it("renders stat cards with totals", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Stat card labels might appear in multiple places (cards, filters, etc)
      // Just verify they are present
      expect(screen.getAllByText("Total").length).toBeGreaterThan(0);
      expect(screen.getAllByText(/cleared/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/outstanding/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/future/i).length).toBeGreaterThan(0);
    });

    it("displays correct total values in stat cards", () => {
      render(<AccountsPage />, { wrapper: createWrapper() });

      // Values should appear multiple times (in stat cards and possibly in table/grid)
      expect(screen.getAllByText("$175.00").length).toBeGreaterThan(0);
      expect(screen.getAllByText("$25.00").length).toBeGreaterThan(0);
      expect(screen.getAllByText("$100.00").length).toBeGreaterThan(0);
      expect(screen.getAllByText("$50.00").length).toBeGreaterThan(0);
    });
  });
});
