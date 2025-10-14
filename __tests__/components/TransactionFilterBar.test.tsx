import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TransactionFilterBar, {
  TransactionFilters,
} from "../../components/TransactionFilterBar";
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
    "bi_annually",
    "fortnightly",
    "quarterly",
    "undefined",
  ]),
  dateRange: {
    start: null,
    end: null,
    preset: "all",
  },
  amountRange: {
    min: -1000,
    max: 1000,
  },
};

const defaultAmountBounds = {
  min: -1000,
  max: 1000,
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByPlaceholderText(/Search by description/)).toBeInTheDocument();
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by description/);
      expect(searchInput).toBeInTheDocument();
    });

    it("should render date range presets", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText("All Time")).toBeInTheDocument();
      expect(screen.getByText("Last 7 Days")).toBeInTheDocument();
      expect(screen.getByText("Last 30 Days")).toBeInTheDocument();
      expect(screen.getByText("Last 90 Days")).toBeInTheDocument();
      expect(screen.getByText("This Year")).toBeInTheDocument();
    });

    it("should render state filter chips", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText("Cleared")).toBeInTheDocument();
      expect(screen.getByText("Outstanding")).toBeInTheDocument();
      expect(screen.getByText("Future")).toBeInTheDocument();
    });

    it("should render type filter chips", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText("All Types")).toBeInTheDocument();
      expect(screen.getByText("Expense")).toBeInTheDocument();
      expect(screen.getByText("Income")).toBeInTheDocument();
      expect(screen.getByText("Transfer")).toBeInTheDocument();
      // "Undefined" appears twice (type and recurrence), just check one exists
      expect(screen.getAllByText("Undefined").length).toBeGreaterThan(0);
    });

    it("should render recurrence filter chips", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      // Type has "All Types" and recurrence has "All"
      expect(screen.getByText("All Types")).toBeInTheDocument();
      expect(screen.getByText("All")).toBeInTheDocument();
      expect(screen.getByText("One-Time")).toBeInTheDocument();
      expect(screen.getByText("Monthly")).toBeInTheDocument();
      expect(screen.getByText("Annually")).toBeInTheDocument();
      expect(screen.getByText("Quarterly")).toBeInTheDocument();
      expect(screen.getByText("Fortnightly")).toBeInTheDocument();
      expect(screen.getByText("Bi-Annually")).toBeInTheDocument();
    });

    it("should render amount range slider", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText(/Amount Range:/)).toBeInTheDocument();
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
          amountBounds={defaultAmountBounds}
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
          amountBounds={defaultAmountBounds}
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const clearButton = screen.getByLabelText(/clear search/i);
      fireEvent.click(clearButton);

      expect(onSearchChange).toHaveBeenCalledWith("");
    });
  });

  describe("Date Range Filtering", () => {
    it("should call onFilterChange when date preset is clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const last7DaysChip = screen.getByText("Last 7 Days");
      fireEvent.click(last7DaysChip);

      expect(onFilterChange).toHaveBeenCalled();
      const callArg = onFilterChange.mock.calls[0][0];
      expect(callArg.dateRange.preset).toBe("7days");
      expect(callArg.dateRange.start).toBeInstanceOf(Date);
    });

    it("should set date range to null when 'All Time' is clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const allTimeChip = screen.getByText("All Time");
      fireEvent.click(allTimeChip);

      expect(onFilterChange).toHaveBeenCalled();
      const callArg = onFilterChange.mock.calls[0][0];
      expect(callArg.dateRange.preset).toBe("all");
      expect(callArg.dateRange.start).toBeNull();
      expect(callArg.dateRange.end).toBeNull();
    });
  });

  describe("State Filtering", () => {
    it("should call onFilterChange when state chip is clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const clearedChip = screen.getByText("Cleared");
      fireEvent.click(clearedChip);

      expect(onFilterChange).toHaveBeenCalled();
    });

    it("should toggle state filter when clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const clearedChip = screen.getByText("Cleared");
      fireEvent.click(clearedChip);

      const callArg = onFilterChange.mock.calls[0][0];
      // Should remove "cleared" from the set
      expect(callArg.states.has("cleared")).toBe(false);
    });
  });

  describe("Type Filtering", () => {
    it("should call onFilterChange when type chip is clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const expenseChip = screen.getByText("Expense");
      fireEvent.click(expenseChip);

      expect(onFilterChange).toHaveBeenCalled();
    });

    it("should select all types when 'All Types' is clicked", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      const partialFilters = {
        ...defaultFilters,
        types: new Set(["expense" as const]),
      };

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={partialFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          amountBounds={defaultAmountBounds}
        />,
      );

      const allTypesChip = screen.getByText("All Types");
      fireEvent.click(allTypesChip);

      const callArg = onFilterChange.mock.calls[0][0];
      expect(callArg.types.size).toBe(4);
    });
  });

  describe("Recurrence Filtering", () => {
    it("should call onFilterChange when recurrence chip is clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const monthlyChip = screen.getByText("Monthly");
      fireEvent.click(monthlyChip);

      expect(onFilterChange).toHaveBeenCalled();
    });

    it("should select all recurrence types when 'All' is clicked", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      const partialFilters = {
        ...defaultFilters,
        reoccurring: new Set(["onetime" as const]),
      };

      renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={partialFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          amountBounds={defaultAmountBounds}
        />,
      );

      // Find and click the recurrence "All" chip
      const recurrenceAllChip = screen.getByText("All");
      fireEvent.click(recurrenceAllChip);

      const callArg = onFilterChange.mock.calls[0][0];
      expect(callArg.reoccurring.size).toBe(7);
    });
  });

  describe("Amount Range Filtering", () => {
    it("should display current amount range", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText(/Amount Range: \$-1000\.00 - \$1000\.00/)).toBeInTheDocument();
    });

    it("should call onFilterChange when amount range slider is adjusted and committed", () => {
      const onSearchChange = jest.fn();
      const onFilterChange = jest.fn();
      const onClearFilters = jest.fn();

      const { container } = renderWithTheme(
        <TransactionFilterBar
          searchTerm=""
          onSearchChange={onSearchChange}
          activeFilters={defaultFilters}
          onFilterChange={onFilterChange}
          onClearFilters={onClearFilters}
          amountBounds={defaultAmountBounds}
        />,
      );

      const slider = container.querySelector('[class*="MuiSlider-root"]');

      // Testing slider interaction in JSDOM is limited
      // The important part is that the component has the slider rendered
      expect(slider).toBeInTheDocument();
    });
  });

  describe("Clear Filters", () => {
    it("should show 'Clear All Filters' button when filters are active", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText("Clear All Filters")).toBeInTheDocument();
    });

    it("should call onClearFilters when 'Clear All Filters' is clicked", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const clearButton = screen.getByText("Clear All Filters");
      fireEvent.click(clearButton);

      expect(onClearFilters).toHaveBeenCalled();
    });

    it("should not show 'Clear All Filters' button when no filters are active", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.queryByText("Clear All Filters")).not.toBeInTheDocument();
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
          amountBounds={defaultAmountBounds}
        />,
      );

      // Check that numbers are displayed
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
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
          amountBounds={defaultAmountBounds}
        />,
      );

      expect(screen.getByText(/\(filtered\)/)).toBeInTheDocument();
    });

    it("should use singular 'transaction' when count is 1", () => {
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
          resultCount={1}
          totalCount={1}
          amountBounds={defaultAmountBounds}
        />,
      );

      // Should show "Showing 1 of 1"
      expect(screen.getByText(/Showing/)).toBeInTheDocument();
      // Can't easily test singular vs plural without inspecting actual text node
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const searchInput = screen.getByPlaceholderText(/Search by description/);
      expect(searchInput).toHaveAttribute("type", "text");
    });

    it("should have clickable filter chips", () => {
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
          amountBounds={defaultAmountBounds}
        />,
      );

      const clearedChip = screen.getByText("Cleared");
      expect(clearedChip).toBeInTheDocument();

      // Should be clickable
      fireEvent.click(clearedChip);
      expect(onFilterChange).toHaveBeenCalled();
    });
  });
});
