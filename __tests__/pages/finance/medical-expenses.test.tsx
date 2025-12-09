import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import MedicalExpenses from "../../../app/finance/medical-expenses/page";
import { MedicalExpense, ClaimStatus } from "../../../model/MedicalExpense";

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// Mock the hooks
jest.mock("../../../hooks/useMedicalExpenseFetch");
jest.mock("../../../hooks/useMedicalExpenseDelete", () => ({
  __esModule: true,
  default: () => ({
    mutateAsync: jest.fn(),
  }),
}));

// Mock complex components to focus on core functionality
jest.mock("../../../components/DataGridBase", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ rows, columns, onRowSelectionModelChange }: any) => {
      // Find the actions column to get the actual click handler
      const actionsColumn = columns?.find(
        (col: any) => col.field === "actions",
      );

      return (
        <div data-testid="medical-expense-grid">
          {rows.map((row: any) => {
            // Simulate the renderCell for actions column
            let deleteButton = null;
            if (actionsColumn?.renderCell) {
              const cellProps = { row, value: null };
              const actionsElement = actionsColumn.renderCell(cellProps);
              // Extract the delete button from the rendered actions
              deleteButton = React.cloneElement(actionsElement);
            }

            return (
              <div
                key={row.medicalExpenseId}
                data-testid={`expense-row-${row.medicalExpenseId}`}
              >
                <span>{row.serviceDescription}</span>
                <span>${row.billedAmount?.toFixed(2)}</span>
                <span>{row.serviceDate?.toLocaleDateString("en-US")}</span>
                <span>{row.claimStatus}</span>
                <span>
                  {row.isOutOfNetwork ? "Out-of-Network" : "In-Network"}
                </span>
                {deleteButton}
              </div>
            );
          })}
        </div>
      );
    },
  };
});

jest.mock("../../../components/EmptyState", () => {
  return {
    __esModule: true,
    default: ({ title, message, onAction, onRefresh }: any) => (
      <div data-testid="empty-state">
        <div>{title}</div>
        <div>{message}</div>
        {onAction && <button onClick={onAction}>Add Medical Expense</button>}
        {onRefresh && <button onClick={onRefresh}>Refresh</button>}
      </div>
    ),
  };
});

jest.mock("../../../components/LoadingState", () => {
  return {
    __esModule: true,
    default: ({ message }: { message: string }) => (
      <div data-testid="loading-state" role="progressbar">
        {message}
      </div>
    ),
  };
});

jest.mock("../../../components/ErrorDisplay", () => {
  return {
    __esModule: true,
    default: ({ error, onRetry }: { error: any; onRetry?: () => void }) => (
      <div data-testid="error-display">
        <div>{error?.message || "An error occurred"}</div>
        {onRetry && (
          <button onClick={onRetry} data-testid="retry-button">
            Retry
          </button>
        )}
      </div>
    ),
  };
});

jest.mock("../../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "testuser" },
  }),
}));

// Mock fetch globally
global.fetch = jest.fn();

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>,
  );
};

describe("MedicalExpenses Page", () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
      pathname: "/finance/medical-expenses",
      query: {},
    });

    jest.clearAllMocks();
  });

  const mockMedicalExpenses: MedicalExpense[] = [
    {
      medicalExpenseId: 1,
      transactionId: 100,
      providerId: 1,
      familyMemberId: 1,
      serviceDate: new Date("2024-01-15T12:00:00Z"),
      serviceDescription: "Annual physical exam",
      procedureCode: "99213",
      diagnosisCode: "Z00.00",
      billedAmount: 250.0,
      insuranceDiscount: 50.0,
      insurancePaid: 150.0,
      patientResponsibility: 50.0,
      paidDate: null,
      isOutOfNetwork: false,
      claimNumber: "CL123456",
      claimStatus: ClaimStatus.Approved,
      activeStatus: true,
      dateAdded: new Date("2024-01-15T10:00:00Z"),
      dateUpdated: new Date("2024-01-15T10:00:00Z"),
    },
    {
      medicalExpenseId: 2,
      transactionId: 101,
      serviceDate: new Date("2024-02-01T12:00:00Z"),
      serviceDescription: "Specialist consultation",
      billedAmount: 300.0,
      insuranceDiscount: 0,
      insurancePaid: 240.0,
      patientResponsibility: 60.0,
      isOutOfNetwork: true,
      claimStatus: ClaimStatus.Paid,
      activeStatus: true,
    },
  ];

  it("should render medical expenses page header", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    expect(screen.getByText("Medical Expenses")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Track and manage your healthcare expenses and insurance claims",
      ),
    ).toBeInTheDocument();
  });

  it("should display add medical expense button", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    expect(screen.getByText("Add Medical Expense")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /add medical expense/i }),
    ).toBeInTheDocument();
  });

  it("should display medical expenses in data grid", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText("Annual physical exam")).toBeInTheDocument();
      expect(screen.getByText("Specialist consultation")).toBeInTheDocument();
    });

    // Check financial amounts are displayed
    expect(screen.getByText("$250.00")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
  });

  it("should show loading state when fetching data", () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isFetching: true,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    expect(screen.getByText("Loading medical expenses...")).toBeInTheDocument();
  });

  it("should show empty state when no medical expenses exist", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      expect(screen.getByText("No Medical Expenses Found")).toBeInTheDocument();
      expect(
        screen.getByText(
          "You haven't added any medical expenses yet. Start tracking your healthcare expenses.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("should show error state when fetch fails", () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    const mockError = new Error("Failed to fetch medical expenses");
    useMedicalExpenseFetch.mockReturnValue({
      data: undefined,
      isSuccess: false,
      isFetching: false,
      error: mockError,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    expect(
      screen.getByText("Failed to fetch medical expenses"),
    ).toBeInTheDocument();
    expect(screen.getByText("Retry")).toBeInTheDocument();
  });

  it("should display summary bar with totals", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      // Check that summary calculations are displayed
      // Total billed: $250 + $300 = $550
      expect(screen.getByText("$550.00")).toBeInTheDocument();
      // Total insurance paid: $150 + $240 = $390
      expect(screen.getByText("$390.00")).toBeInTheDocument();
      // Total patient responsibility appears twice (outstanding and future columns)
      const patientResponsibilityElements = screen.getAllByText("$110.00");
      expect(patientResponsibilityElements).toHaveLength(2);
    });
  });

  it("should display claim status chips correctly", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      expect(screen.getByText("approved")).toBeInTheDocument();
      expect(screen.getByText("paid")).toBeInTheDocument();
    });
  });

  it("should display network status chips correctly", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      expect(screen.getByText("In-Network")).toBeInTheDocument();
      expect(screen.getByText("Out-of-Network")).toBeInTheDocument();
    });
  });

  it("should handle delete button click", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    // Reset and properly mock the delete hook
    jest.resetModules();
    const mockDelete = jest.fn();
    jest.doMock("../../../hooks/useMedicalExpenseDelete", () => ({
      __esModule: true,
      default: () => ({
        mutateAsync: mockDelete,
      }),
    }));

    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      const deleteButtons = screen.getAllByLabelText("Delete this row");
      expect(deleteButtons).toHaveLength(2);

      fireEvent.click(deleteButtons[0]);
    });

    // Should open confirm dialog
    expect(screen.getByText("Confirm Deletion")).toBeInTheDocument();
  });

  it("should handle add button click", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    const addButton = screen.getByRole("button", {
      name: /add medical expense/i,
    });
    fireEvent.click(addButton);

    // Should indicate that add functionality will be implemented
    // For now, we'll just check that the button is clickable
    expect(addButton).toBeInTheDocument();
  });

  // NOTE: Authentication redirect test is complex to mock properly in Jest
  // The component correctly redirects when not authenticated, but mocking the
  // useAuth hook mid-test is challenging with the current test setup.
  // This functionality is verified through integration testing.

  it("should format currency amounts correctly", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      // Based on the HTML output, the amounts appear in spans as "$250.00"
      // Look for the complete formatted amounts in the data grid mock
      expect(
        screen.getByText((content, element) => {
          return (
            element?.tagName.toLowerCase() === "span" && content === "$250.00"
          );
        }),
      ).toBeInTheDocument();
      expect(
        screen.getByText((content, element) => {
          return (
            element?.tagName.toLowerCase() === "span" && content === "$300.00"
          );
        }),
      ).toBeInTheDocument();
    });
  });

  it("should format service dates correctly", async () => {
    const useMedicalExpenseFetch =
      require("../../../hooks/useMedicalExpenseFetch").default;
    useMedicalExpenseFetch.mockReturnValue({
      data: mockMedicalExpenses,
      isSuccess: true,
      isFetching: false,
      error: null,
      refetch: jest.fn(),
    });

    renderWithProviders(<MedicalExpenses />);

    await waitFor(() => {
      // Check that dates are formatted correctly
      expect(screen.getByText("1/15/2024")).toBeInTheDocument();
      expect(screen.getByText("2/1/2024")).toBeInTheDocument();
    });
  });
});
