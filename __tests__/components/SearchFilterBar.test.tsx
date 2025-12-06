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

    const searchInput = screen.getByPlaceholderText(/search accounts/i);
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

    const searchInput = screen.getByPlaceholderText(/search accounts/i);
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

  it("renders account type filter chips", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.getByText("Debit")).toBeInTheDocument();
    expect(screen.getByText("Credit")).toBeInTheDocument();
  });

  it("renders quick filter presets", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    expect(screen.getByText("Payment Required")).toBeInTheDocument();
    expect(screen.getByText("Needs Attention")).toBeInTheDocument();
    expect(screen.getByText("Future Scheduled")).toBeInTheDocument();
  });

  it("renders zero balance filter chip", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

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

  it("handles quick filter preset", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(screen.getByText("Needs Attention"));
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      accountType: "all",
      activeStatus: "active",
      balanceStatus: "hasOutstanding",
    });
  });

  it("handles zero balance filter change", () => {
    render(
      <SearchFilterBar
        searchTerm=""
        onSearchChange={mockOnSearchChange}
        activeFilters={defaultFilters}
        onFilterChange={mockOnFilterChange}
        onClearFilters={mockOnClearFilters}
      />,
    );

    fireEvent.click(screen.getByText("Zero Balance"));
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      ...defaultFilters,
      balanceStatus: "zeroBalance",
    });
  });

  it("shows Clear All button", () => {
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
});
