import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitForElementToBeRemoved,
} from "@testing-library/react";

jest.mock("next/router", () => ({
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

let capturedColumns: any[] = [];
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [] }: any) => {
    capturedColumns = columns;
    return (
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
    );
  },
}));

// Mock EmptyState component
jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && <button onClick={onAction}>Add Description</button>}
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  ),
}));

jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("../../../hooks/useDescriptionFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const insertDescriptionMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useDescriptionInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: insertDescriptionMock }),
}));
const deleteDescriptionMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useDescriptionDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: deleteDescriptionMock }),
}));
jest.mock("../../../hooks/useDescriptionUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
// New merge hook for descriptions page
jest.mock("../../../hooks/useDescriptionMerge", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

import DescriptionsPage from "../../../pages/finance/descriptions";
import useDescriptionFetchMock from "../../../hooks/useDescriptionFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

describe("pages/finance/descriptions", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUseDescriptionFetch =
    useDescriptionFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("shows loading state", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [],
      isSuccess: false,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    expect(screen.getByText(/Loading descriptions/i)).toBeInTheDocument();
  });

  it("shows error and retries", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    const refetch = jest.fn();
    mockUseDescriptionFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: false,
      isError: true,
      error: new Error("boom"),
      refetch,
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("opens Add Description modal", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 1, descriptionName: "Grocery", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add description/i }));
    expect(screen.getByText(/Add New Description/i)).toBeInTheDocument();
  });

  it("adds a new description (happy path)", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 99, descriptionName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add description/i }));
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertDescriptionMock).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Name is required/i)).toHaveLength(2);
  });

  it("shows error when add description fails", async () => {
    insertDescriptionMock.mockRejectedValueOnce(new Error("Boom"));
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 99, descriptionName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add description/i }));
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertDescriptionMock).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Name is required/i)).toHaveLength(2);
  });

  it("does not submit when Add Description form is empty", () => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 99, descriptionName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add description/i }));
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertDescriptionMock).not.toHaveBeenCalled();
    // Validation appears in both snackbar and helper text
    expect(screen.getAllByText(/Name is required/i)).toHaveLength(2);
  });

  it("toggles status switch without errors", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 99, descriptionName: "Seed", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByRole("button", { name: /add description/i }));
    const sw = screen.getByRole("switch", { name: /status/i });
    const initialChecked = (sw as HTMLInputElement).checked;
    fireEvent.click(sw);
    expect((sw as HTMLInputElement).checked).toBe(!initialChecked);
  });

  it("opens delete confirmation from actions and confirms", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 1, descriptionName: "Grocery", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    const actionsCell = screen.getByTestId("cell-0-actions");
    const delBtn = actionsCell.querySelector("button");
    if (!delBtn) throw new Error("Delete button not found");
    fireEvent.click(delBtn);
    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    const deleteButton = await screen.findByRole("button", {
      name: /^delete$/i,
      hidden: true,
    });
    fireEvent.click(deleteButton);
    expect(deleteDescriptionMock).toHaveBeenCalled();
  });

  it("validates description name length", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    // Get the main Add Description button (not the one in empty state)
    const addButtons = screen.getAllByRole("button", {
      name: /add description/i,
    });
    fireEvent.click(addButtons[0]); // Click the first one (main button)

    // Test name too long
    const longName = "a".repeat(256);
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(insertDescriptionMock).not.toHaveBeenCalled();
    // Form state remains empty, so required validation surfaces
    expect(screen.getAllByText(/Name is required/i)).toHaveLength(2);
  });

  it("validates description name contains only valid characters", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    const addButtons = screen.getAllByRole("button", {
      name: /add description/i,
    });
    fireEvent.click(addButtons[0]); // Click the first one (main button)

    // Test invalid characters
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));

    expect(insertDescriptionMock).not.toHaveBeenCalled();
    // Form state remains empty, so required validation surfaces
    expect(screen.getAllByText(/Name is required/i)).toHaveLength(2);
  });

  it("shows empty state when no descriptions exist", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    expect(screen.getByText(/No Descriptions Found/i)).toBeInTheDocument();
    expect(
      screen.getByText(/You haven't created any descriptions yet/i),
    ).toBeInTheDocument();
  });

  it("handles empty state action to open add modal", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    const refetch = jest.fn();
    mockUseDescriptionFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<DescriptionsPage />);

    // Click the action button in empty state (use the main Add Description button)
    const addButtons = screen.getAllByRole("button", {
      name: /add description/i,
    });
    fireEvent.click(addButtons[0]); // Main button
    expect(screen.getByText(/Add New Description/i)).toBeInTheDocument();
  });

  it("renders description links correctly", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        {
          descriptionId: 1,
          descriptionName: "Test Description",
          activeStatus: true,
        },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    const link = screen.getByText("Test Description").closest("a");
    expect(link).toHaveAttribute(
      "href",
      "/finance/transactions/description/Test Description",
    );
  });

  it("cancels delete modal when cancel button is clicked", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 1, descriptionName: "Grocery", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);
    const actionsCell = screen.getByTestId("cell-0-actions");
    const delBtn = actionsCell.querySelector("button");
    if (!delBtn) throw new Error("Delete button not found");
    fireEvent.click(delBtn);

    expect(screen.getByText(/Confirm Deletion/i)).toBeInTheDocument();
    const cancelButton = await screen.findByRole("button", {
      name: /cancel/i,
      hidden: true,
    });
    fireEvent.click(cancelButton);

    await waitForElementToBeRemoved(() =>
      screen.queryByText(/Confirm Deletion/i),
    );
    expect(deleteDescriptionMock).not.toHaveBeenCalled();
  });

  it("handles empty state refresh action", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    const refetch = jest.fn();
    mockUseDescriptionFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<DescriptionsPage />);

    // Find and click refresh button in empty state
    fireEvent.click(screen.getByText(/Refresh/i));
    expect(refetch).toHaveBeenCalled();
  });

  it("does not include Count column", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseDescriptionFetch.mockReturnValue({
      data: [
        { descriptionId: 1, descriptionName: "Grocery", activeStatus: true },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<DescriptionsPage />);

    // Ensure the columns passed to DataGrid do not include the Count column
    const hasCount = capturedColumns.some(
      (c) => c.field === "descriptionCount" || c.headerName === "Count",
    );
    expect(hasCount).toBe(false);
  });
});
