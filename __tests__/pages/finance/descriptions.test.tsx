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
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "Grocery" },
    });
    const statusSwitch = screen.getByRole("switch", { name: /status/i });
    if (!(statusSwitch as HTMLInputElement).checked) {
      fireEvent.click(statusSwitch);
    }
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertDescriptionMock).toHaveBeenCalled();
    expect(
      await screen.findByText(/Description inserted successfully/i),
    ).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "G" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertDescriptionMock).toHaveBeenCalled();
    expect(
      await screen.findByText(/Add Description error: Boom/i),
    ).toBeInTheDocument();
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
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
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

  it("opens delete confirmation from actions and confirms", () => {
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
    fireEvent.click(screen.getByRole("button", { name: /delete/i }));
    expect(deleteDescriptionMock).toHaveBeenCalled();
  });
});
