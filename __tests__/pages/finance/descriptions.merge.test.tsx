import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitForElementToBeRemoved,
} from "@testing-library/react";

// Mock next/router
jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Localized mock of DataGrid to simulate selection
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: (props: any) => {
    const { rows = [], onRowSelectionModelChange } = props;
    return (
      <div data-testid="mocked-datagrid-merge">
        <button
          onClick={() =>
            onRowSelectionModelChange?.([
              rows[0]?.descriptionId,
              rows[1]?.descriptionId,
            ])
          }
        >
          Select Two
        </button>
        <button onClick={() => onRowSelectionModelChange?.([])}>Clear</button>
      </div>
    );
  },
}));

jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn().mockReturnValue({ isAuthenticated: true, loading: false }),
}));

jest.mock("../../../hooks/useDescriptionFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
// Mock other hooks used by the page to avoid QueryClient wiring
jest.mock("../../../hooks/useDescriptionInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
jest.mock("../../../hooks/useDescriptionDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
jest.mock("../../../hooks/useDescriptionUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

const mergeMock = jest.fn().mockResolvedValue({ done: true });
jest.mock("../../../hooks/useDescriptionMerge", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mergeMock }),
}));

import useDescriptionFetchMock from "../../../hooks/useDescriptionFetch";
import DescriptionsPage from "../../../pages/finance/descriptions";

describe("Descriptions merge UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const rows = [
    { descriptionId: 1, descriptionName: "Alpha", activeStatus: true },
    { descriptionId: 2, descriptionName: "Beta", activeStatus: true },
    { descriptionId: 3, descriptionName: "Gamma", activeStatus: true },
  ];

  it("shows Merge button only when selection exists and performs merge", async () => {
    const refetch = jest.fn();
    (useDescriptionFetchMock as unknown as jest.Mock).mockReturnValue({
      data: rows,
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<DescriptionsPage />);

    // Initially no Merge button
    expect(
      screen.queryByRole("button", { name: /^merge$/i }),
    ).not.toBeInTheDocument();

    // Trigger selection via mocked grid control
    fireEvent.click(screen.getByText("Select Two"));

    // Merge button appears
    const mergeBtn = await screen.findByRole("button", { name: /^merge$/i });
    fireEvent.click(mergeBtn);

    // Modal opens
    const dialog = screen.getByRole("dialog", { name: /Merge Descriptions/i });

    // Submit disabled until valid
    const modalSubmit = within(dialog).getByRole("button", {
      name: /^merge$/i,
    });
    expect(modalSubmit).toBeDisabled();

    // Enter valid name
    fireEvent.change(screen.getByLabelText(/new name/i), {
      target: { value: "Merged Name" },
    });
    expect(modalSubmit).not.toBeDisabled();

    // Confirm merge
    fireEvent.click(modalSubmit);

    expect(mergeMock).toHaveBeenCalledWith({
      sourceNames: ["Alpha", "Beta"],
      targetName: "Merged Name",
    });

    // Success snackbar and refetch
    expect(
      await screen.findByText(/Descriptions merged successfully/i),
    ).toBeInTheDocument();

    // Wait for modal to close before asserting header state
    await waitForElementToBeRemoved(() =>
      screen.queryByRole("dialog", { name: /Merge Descriptions/i }),
    );
    expect(refetch).toHaveBeenCalled();

    // Merge button disappears after selection cleared
    expect(
      screen.queryByRole("button", { name: /^merge$/i }),
    ).not.toBeInTheDocument();
  });

  it("validates new name and does not call merge on cancel", () => {
    const refetch = jest.fn();
    (useDescriptionFetchMock as unknown as jest.Mock).mockReturnValue({
      data: rows,
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<DescriptionsPage />);
    fireEvent.click(screen.getByText("Select Two"));

    fireEvent.click(screen.getByRole("button", { name: /^merge$/i }));
    // Type invalid input (spaces only) to trigger validation helper
    const dialog = screen.getByRole("dialog", { name: /Merge Descriptions/i });
    const input = within(dialog).getByLabelText(/new name/i);
    fireEvent.change(input, { target: { value: "   " } });
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(mergeMock).not.toHaveBeenCalled();

    // Cancel and wait for dialog to close
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    return waitForElementToBeRemoved(() =>
      screen.queryByRole("dialog", { name: /Merge Descriptions/i }),
    );
    expect(mergeMock).not.toHaveBeenCalled();
  });
});
