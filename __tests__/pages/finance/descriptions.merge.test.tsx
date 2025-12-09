import React from "react";
import {
  render,
  screen,
  fireEvent,
  within,
  waitForElementToBeRemoved,
} from "@testing-library/react";

// Mock next/router
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Mock DataGrid to simulate custom checkbox selection
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: (props: any) => {
    const { rows = [], columns = [] } = props;
    const React = require("react");

    // Find the select column (custom checkbox column)
    const selectColumn = columns.find((col: any) => col.field === "select");

    const elements = [];

    // Render header checkbox
    if (selectColumn) {
      elements.push(
        React.createElement(
          "div",
          { key: "header" },
          React.createElement("span", { key: "header-text" }, "Select All"),
          selectColumn.renderHeader && selectColumn.renderHeader(),
        ),
      );
    }

    // Render row checkboxes
    rows.forEach((row: any, index: number) => {
      elements.push(
        React.createElement(
          "div",
          { key: row.descriptionId || index },
          React.createElement(
            "span",
            { key: `name-${index}` },
            row.descriptionName,
          ),
          selectColumn &&
            selectColumn.renderCell &&
            selectColumn.renderCell({ row, value: null }),
        ),
      );
    });

    // Test helper buttons - not needed anymore since we use direct checkbox clicks

    return React.createElement(
      "div",
      { "data-testid": "mocked-datagrid-merge" },
      elements,
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
import DescriptionsPage from "../../../app/finance/descriptions/page";

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

    // Find and click individual checkboxes to simulate selection
    const checkboxes = screen.getAllByRole("checkbox");
    // Click first two row checkboxes (skip header checkbox at index 0)
    fireEvent.click(checkboxes[1]); // First row
    fireEvent.click(checkboxes[2]); // Second row

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

    // Select rows using checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]); // First row
    fireEvent.click(checkboxes[2]); // Second row

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
