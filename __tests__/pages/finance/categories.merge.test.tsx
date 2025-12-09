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

    const selectColumn = columns.find((col: any) => col.field === "select");
    const elements = [] as any[];

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

    rows.forEach((row: any, index: number) => {
      elements.push(
        React.createElement(
          "div",
          { key: row.categoryId || index },
          React.createElement(
            "span",
            { key: `name-${index}` },
            row.categoryName,
          ),
          selectColumn &&
            selectColumn.renderCell &&
            selectColumn.renderCell({ row, value: null }),
        ),
      );
    });

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

jest.mock("../../../hooks/useCategoryFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));

// Mock other hooks used by the page
jest.mock("../../../hooks/useCategoryInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
jest.mock("../../../hooks/useCategoryDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
jest.mock("../../../hooks/useCategoryUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

const mergeMock = jest.fn().mockResolvedValue({ done: true });
jest.mock("../../../hooks/useCategoryMerge", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: mergeMock }),
}));

import useCategoryFetchMock from "../../../hooks/useCategoryFetch";
import CategoriesPage from "../../../app/finance/categories/page";

describe("Categories merge UI", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const rows = [
    { categoryId: 1, categoryName: "Alpha", activeStatus: true },
    { categoryId: 2, categoryName: "Beta", activeStatus: true },
    { categoryId: 3, categoryName: "Gamma", activeStatus: true },
  ];

  it("shows Merge button only when selection exists and performs merge", async () => {
    const refetch = jest.fn();
    (useCategoryFetchMock as unknown as jest.Mock).mockReturnValue({
      data: rows,
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<CategoriesPage />);

    expect(
      screen.queryByRole("button", { name: /^merge$/i }),
    ).not.toBeInTheDocument();

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    const mergeBtn = await screen.findByRole("button", { name: /^merge$/i });
    fireEvent.click(mergeBtn);

    const dialog = screen.getByRole("dialog", { name: /Merge Categories/i });
    const modalSubmit = within(dialog).getByRole("button", {
      name: /^merge$/i,
    });
    expect(modalSubmit).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/new name/i), {
      target: { value: "Merged Name" },
    });
    expect(modalSubmit).not.toBeDisabled();

    fireEvent.click(modalSubmit);
    expect(mergeMock).toHaveBeenCalledWith({
      sourceNames: ["Alpha", "Beta"],
      targetName: "Merged Name",
    });

    expect(
      await screen.findByText(/Categories merged successfully/i),
    ).toBeInTheDocument();

    await waitForElementToBeRemoved(() =>
      screen.queryByRole("dialog", { name: /Merge Categories/i }),
    );
    expect(refetch).toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /^merge$/i }),
    ).not.toBeInTheDocument();
  });

  it("validates new name and does not call merge on cancel", () => {
    const refetch = jest.fn();
    (useCategoryFetchMock as unknown as jest.Mock).mockReturnValue({
      data: rows,
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch,
    });

    render(<CategoriesPage />);

    const checkboxes = screen.getAllByRole("checkbox");
    fireEvent.click(checkboxes[1]);
    fireEvent.click(checkboxes[2]);

    fireEvent.click(screen.getByRole("button", { name: /^merge$/i }));
    const dialog = screen.getByRole("dialog", { name: /Merge Categories/i });
    const input = within(dialog).getByLabelText(/new name/i);
    fireEvent.change(input, { target: { value: "   " } });
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(mergeMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    return waitForElementToBeRemoved(() =>
      screen.queryByRole("dialog", { name: /Merge Categories/i }),
    );
  });
});
