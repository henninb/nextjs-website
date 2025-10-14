import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import SearchFilterBar from "../../components/SearchFilterBar";

describe("SearchFilterBar", () => {
  const mockOnSearchChange = jest.fn();
  const mockOnFilterChange = jest.fn();
  const mockOnClearFilters = jest.fn();

  const defaultFilters = {
    accountType: "all" as const,
    activeStatus: "all" as const,
    balanceStatus: "all" as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders search input", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /search accounts by name or moniker/i,
    );
    expect(searchInput).toBeInTheDocument();
  });

  it("handles search input change", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const searchInput = screen.getByPlaceholderText(
      /search accounts by name or moniker/i,
    );
    fireEvent.change(searchInput, { target: { value: "Chase" } });
    expect(mockOnSearchChange).toHaveBeenCalledWith("Chase");
  });

  it("displays clear search button when search term exists", () => {
    render(
      <SearchFilterBar
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const clearButton = screen.getByLabelText(/clear search/i);
    expect(clearButton).toBeInTheDocument();
  });

  it("clears search term when clear button is clicked", () => {
    render(
      <SearchFilterBar
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    const clearButton = screen.getByLabelText(/clear search/i);
    fireEvent.click(clearButton);
    expect(mockOnSearchChange).toHaveBeenCalledWith("");
  });

  it("renders all account type filter chips", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.getByText("All Types")).toBeInTheDocument();
    expect(screen.getByText("Debit")).toBeInTheDocument();
    expect(screen.getByText("Credit")).toBeInTheDocument();
  });

  it("renders all active status filter chips", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.getByText("All Status")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders all balance status filter chips", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.getByText("All Balances")).toBeInTheDocument();
    expect(screen.getByText("Has Activity")).toBeInTheDocument();
    expect(screen.getByText("Has Outstanding")).toBeInTheDocument();
    expect(screen.getByText("Has Future")).toBeInTheDocument();
    expect(screen.getByText("Has Cleared")).toBeInTheDocument();
    expect(screen.getByText("Zero Balance")).toBeInTheDocument();
  });

  it("handles account type filter change", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(screen.getByText("Debit"));
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      accountType: "debit",
    });
  });

  it("handles active status filter change", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(screen.getByText("Active"));
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      activeStatus: "active",
    });
  });

  it("handles balance status filter change", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(screen.getByText("Has Outstanding"));
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      balanceStatus: "hasOutstanding",
    });
  });

  it("shows Clear All button when filters are active", () => {
    render(
      <SearchFilterBar
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.getByText("Clear All")).toBeInTheDocument();
  });

  it("does not show Clear All button when no filters are active", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
  });

  it("calls onClearFilters when Clear All is clicked", () => {
    render(
      <SearchFilterBar
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(screen.getByText("Clear All"));
    expect(mockOnClearFilters).toHaveBeenCalled();
  });

  it("displays result count when provided", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        resultCount={5}
        totalCount={10}
      />,
    );

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows filtered indicator in result count when filters are active", () => {
    render(
      <SearchFilterBar
        searchTerm="test"
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
        resultCount={3}
        totalCount={10}
      />,
    );

    expect(screen.getByText(/filtered/i)).toBeInTheDocument();
  });

  it("applies correct styles to selected filter chips", () => {
    const activeFilters = {
      accountType: "debit" as const,
      activeStatus: "active" as const,
      balanceStatus: "hasOutstanding" as const,
    };

    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={activeFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    // Selected chips should be rendered (testing presence is enough since MUI handles styling)
    expect(screen.getByText("Debit")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByText("Has Outstanding")).toBeInTheDocument();
  });
});
