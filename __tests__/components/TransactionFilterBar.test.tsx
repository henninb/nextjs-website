import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TransactionFilterBar, {
  TransactionFilters,
} from "../../components/TransactionFilterBar";
import {
  DEFAULT_AMOUNT_RANGE,
  isAmountRangeActive,
} from "../../utils/transactionFilters";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

const defaultFilters: TransactionFilters = {
  states: new Set(["cleared", "outstanding", "future"]),
  types: new Set(["expense", "income", "transfer", "undefined"]),
  reoccurring: new Set([
    "onetime",
    "monthly",
    "annually",
    "biannually",
    "fortnightly",
    "quarterly",
    "undefined",
  ]),
  dateRange: {
    start: null,
    end: null,
    preset: "all",
  },
  amountRange: { ...DEFAULT_AMOUNT_RANGE },
};

describe("TransactionFilterBar", () => {
  describe("Rendering", () => {
    it("should render without crashing", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      expect(
        screen.getByPlaceholderText(/Search by description/),
      ).toBeInTheDocument();
    });

    it("should render search input", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by description/);
      expect(searchInput).toBeInTheDocument();
    });
  });

  describe("Search Functionality", () => {
    it("should call onSearchChange when search input changes", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by description/);
      fireEvent.change(searchInput, { target: { value: "groceries" } });

      expect(onSearchChange).toHaveBeenCalledWith("groceries");
    });

    it("should display clear button when search term is not empty", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm="test search"
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      const clearButton = screen.getByLabelText(/clear search/i);
      expect(clearButton).toBeInTheDocument();
    });

    it("should call onSearchChange with empty string when clear button is clicked", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm="test search"
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);

      expect(onSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Clear Filters", () => {
    it("should show 'Clear All' button when filters are active", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      const activeFilters = {
        ...defaultFilters,
        states: new Set(["cleared" as const]), // Not all states selected
      };

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });

    it("should call onClearFilters when 'Clear All' is clicked", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      const activeFilters = {
        ...defaultFilters,
        states: new Set(["cleared" as const]),
      };

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      const clearButton = screen.getByText("Clear All");
      fireEvent.click(clearButton);

      expect(onClearFilters).toHaveBeenCalled();
    });

    it("should not show 'Clear All' button when no filters are active", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      expect(screen.queryByText("Clear All")).not.toBeInTheDocument();
    });
  });

  describe("Result Count Display", () => {
    it("should display result count when provided", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          resultCount={45}
          totalCount={120}
        />,
      );

      // Check that numbers are displayed in format "45 / 120"
      expect(screen.getByText("45")).toBeInTheDocument();
      expect(screen.getByText("120")).toBeInTheDocument();
    });

    it("should show '(filtered)' indicator when filters are active", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      const activeFilters = {
        ...defaultFilters,
        states: new Set(["cleared" as const]),
      };

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={activeFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          resultCount={45}
          totalCount={120}
        />,
      );

      expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have accessible search input", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
        />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by description/);
      expect(searchInput).toHaveAttribute("type", "text");
    });
  });

  describe("Amount range", () => {
    it("treats the default range as no filter", () => {
      expect(isAmountRangeActive(DEFAULT_AMOUNT_RANGE)).toBe(false);
    });

    it("treats a range narrower than the default as active", () => {
      expect(isAmountRangeActive({ min: -250, max: 10000 })).toBe(true);
      expect(isAmountRangeActive({ min: -10000, max: 0 })).toBe(true);
    });

    it("shows 'Clear All' when only the amount range is narrowed", () => {
      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={jest.fn()}
          activeFilters={{
            ...defaultFilters,
            amountRange: { min: -250, max: 0 },
          }}
          onFilterChange={jest.fn()}
          onClearFilters={jest.fn()}
        />,
      );
      expect(screen.getByText("Clear All")).toBeInTheDocument();
    });
  });
});
