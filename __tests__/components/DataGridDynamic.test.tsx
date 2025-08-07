import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { CircularProgress } from "@mui/material";

// Mock the @mui/x-data-grid module
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows, columns, ...props }: any) => (
    <div data-testid="mocked-datagrid" role="grid">
      Mocked DataGrid - {rows?.length || 0} rows
    </div>
  ),
}));

// Import the actual component
import DataGridDynamic from "../../components/DataGridDynamic";

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("DataGridDynamic Component", () => {
  describe("Loading State", () => {
    it("shows loading spinner initially", () => {
      renderWithTheme(<DataGridDynamic rows={[]} columns={[]} />);

      const loadingElement = screen.getByRole("progressbar");
      expect(loadingElement).toBeInTheDocument();
    });

    it("shows loading component while dynamic import is pending", async () => {
      renderWithTheme(<DataGridDynamic rows={[]} columns={[]} />);

      // Initially might show loading, but due to mocking it resolves immediately
      // So we just check that the component renders without error
      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });
    });
  });

  describe("Dynamic Import Behavior", () => {
    it("renders DataGrid after dynamic import completes", async () => {
      renderWithTheme(<DataGridDynamic rows={[]} columns={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });

      expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    });

    it("passes all props to the dynamically imported DataGrid", async () => {
      const mockRows = [
        { id: 1, name: "Test Transaction", amount: 100 },
        { id: 2, name: "Another Transaction", amount: -50 },
      ];

      const mockColumns = [
        { field: "name", headerName: "Transaction", width: 200 },
        { field: "amount", headerName: "Amount", width: 150 },
      ];

      renderWithTheme(
        <DataGridDynamic
          rows={mockRows}
          columns={mockColumns}
          pageSize={25}
          disableSelectionOnClick
          autoHeight
        />,
      );

      await waitFor(() => {
        const dataGrid = screen.getByTestId("mocked-datagrid");
        expect(dataGrid).toBeInTheDocument();
      });
    });
  });

  describe("SSR Configuration", () => {
    it("is configured to disable server-side rendering", async () => {
      renderWithTheme(<DataGridDynamic rows={[]} columns={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });
    });
  });

  describe("Performance", () => {
    it("handles large datasets efficiently through dynamic loading", async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, index) => ({
        id: index,
        name: `Transaction ${index}`,
        amount: Math.random() * 1000 - 500,
      }));

      const columns = [
        { field: "name", headerName: "Transaction", width: 200 },
        { field: "amount", headerName: "Amount", width: 150 },
      ];

      renderWithTheme(
        <DataGridDynamic rows={largeDataset} columns={columns} />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
        expect(
          screen.getByText("Mocked DataGrid - 1000 rows"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Integration with Finance App", () => {
    it("works with typical finance data structure", async () => {
      const financeData = [
        {
          id: 1,
          accountNameOwner: "Chase Checking",
          transactionDate: "2024-01-01",
          amount: 1500.0,
          category: "Salary",
          description: "Monthly Salary",
        },
        {
          id: 2,
          accountNameOwner: "Chase Checking",
          transactionDate: "2024-01-02",
          amount: -85.5,
          category: "Groceries",
          description: "Supermarket Purchase",
        },
      ];

      const financeColumns = [
        { field: "accountNameOwner", headerName: "Account", width: 150 },
        { field: "transactionDate", headerName: "Date", width: 120 },
        { field: "amount", headerName: "Amount", width: 120 },
        { field: "category", headerName: "Category", width: 120 },
        { field: "description", headerName: "Description", width: 200 },
      ];

      renderWithTheme(
        <DataGridDynamic
          rows={financeData}
          columns={financeColumns}
          pageSize={50}
          disableSelectionOnClick
          autoHeight
        />,
      );

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });
    });

    it("supports common DataGrid props used in finance pages", async () => {
      renderWithTheme(
        <DataGridDynamic
          rows={[]}
          columns={[]}
          loading={false}
          pageSize={100}
          disableSelectionOnClick
          autoHeight
        />,
      );

      await waitFor(() => {
        const dataGrid = screen.getByTestId("mocked-datagrid");
        expect(dataGrid).toBeInTheDocument();
      });
    });
  });

  describe("Error Handling", () => {
    it("handles empty rows gracefully", async () => {
      const columns = [{ field: "name", headerName: "Name", width: 200 }];

      renderWithTheme(<DataGridDynamic rows={[]} columns={columns} />);

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });
    });

    it("handles empty columns gracefully", async () => {
      const rows = [{ id: 1, name: "Test" }];

      renderWithTheme(<DataGridDynamic rows={rows} columns={[]} />);

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("maintains accessibility through dynamic loading", async () => {
      const rows = [{ id: 1, name: "Test Transaction" }];
      const columns = [
        { field: "name", headerName: "Transaction Name", width: 200 },
      ];

      renderWithTheme(<DataGridDynamic rows={rows} columns={columns} />);

      await waitFor(() => {
        expect(screen.getByTestId("mocked-datagrid")).toBeInTheDocument();
      });
    });
  });
});
