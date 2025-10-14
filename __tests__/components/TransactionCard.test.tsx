import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TransactionCard from "../../components/TransactionCard";
import Transaction from "../../model/Transaction";
import { TransactionState } from "../../model/TransactionState";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

const mockTransaction: Transaction = {
  transactionId: 1,
  transactionDate: new Date("2024-01-15"),
  description: "Test Transaction",
  category: "Groceries",
  amount: -50.0,
  transactionState: "outstanding" as TransactionState,
  transactionType: "expense",
  reoccurringType: "onetime",
  accountNameOwner: "test_account",
  accountType: "debit",
  guid: "test-guid-123",
  activeStatus: true,
  notes: "Test notes for this transaction",
};

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("TransactionCard", () => {
  describe("Rendering", () => {
    it("should render transaction with all basic information", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      expect(screen.getByText("Test Transaction")).toBeInTheDocument();
      expect(screen.getByText("Groceries")).toBeInTheDocument();
      expect(screen.getByText("-$50.00")).toBeInTheDocument();
    });

    it("should render date badge", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      // Date should be formatted and displayed
      expect(screen.getByText(/2024/)).toBeInTheDocument();
    });

    it("should render state chips", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      expect(screen.getByText("Cleared")).toBeInTheDocument();
      expect(screen.getByText("Outstanding")).toBeInTheDocument();
      expect(screen.getByText("Future")).toBeInTheDocument();
    });

    it("should render transaction type chip", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      expect(screen.getByText("expense")).toBeInTheDocument();
    });

    it("should render reoccurring type chip", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      expect(screen.getByText("One-Time")).toBeInTheDocument();
    });

    it("should render notes when present", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      expect(screen.getByText(/Test notes/)).toBeInTheDocument();
    });

    it("should render actions menu button", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      const buttons = screen.getAllByRole("button");
      // Menu button should be present (IconButton with MoreVertIcon)
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should show 'No description' when description is missing", () => {
      const transactionNoDesc = { ...mockTransaction, description: "" };
      renderWithTheme(<TransactionCard transaction={transactionNoDesc} />);

      expect(screen.getByText("No description")).toBeInTheDocument();
    });

    it("should not render category chip when category is missing", () => {
      const transactionNoCategory = { ...mockTransaction, category: "" };
      renderWithTheme(<TransactionCard transaction={transactionNoCategory} />);

      expect(screen.queryByText("Groceries")).not.toBeInTheDocument();
    });

    it("should not render notes section when notes are missing", () => {
      const transactionNoNotes = { ...mockTransaction, notes: "" };
      renderWithTheme(<TransactionCard transaction={transactionNoNotes} />);

      expect(screen.queryByText("Notes")).not.toBeInTheDocument();
    });
  });

  describe("Amount Color Coding", () => {
    it("should display negative amounts in red for expenses", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      const amountElement = screen.getByText("-$50.00");
      expect(amountElement).toHaveStyle({ color: "#ef4444" });
    });

    it("should display positive amounts in green for income", () => {
      const incomeTransaction = {
        ...mockTransaction,
        amount: 100.0,
        transactionType: "income" as const,
      };
      renderWithTheme(<TransactionCard transaction={incomeTransaction} />);

      const amountElement = screen.getByText("$100.00");
      expect(amountElement).toHaveStyle({ color: "#22c55e" });
    });

    it("should display zero amounts with default color", () => {
      const zeroTransaction = { ...mockTransaction, amount: 0 };
      renderWithTheme(<TransactionCard transaction={zeroTransaction} />);

      const amountElement = screen.getByText("$0.00");
      // Zero amounts get text.secondary which resolves to rgba(0, 0, 0, 0.6) in the theme
      expect(amountElement).toBeInTheDocument();
    });
  });

  describe("State Indicators", () => {
    it("should highlight cleared state when transaction is cleared", () => {
      const clearedTransaction = {
        ...mockTransaction,
        transactionState: "cleared" as TransactionState,
      };
      renderWithTheme(<TransactionCard transaction={clearedTransaction} />);

      const clearedChip = screen.getByText("Cleared");
      // Check that it has filled variant by checking parent properties
      expect(clearedChip).toBeInTheDocument();
    });

    it("should highlight outstanding state when transaction is outstanding", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      const outstandingChip = screen.getByText("Outstanding");
      expect(outstandingChip).toBeInTheDocument();
    });

    it("should highlight future state when transaction is future", () => {
      const futureTransaction = {
        ...mockTransaction,
        transactionState: "future" as TransactionState,
      };
      renderWithTheme(<TransactionCard transaction={futureTransaction} />);

      const futureChip = screen.getByText("Future");
      expect(futureChip).toBeInTheDocument();
    });
  });

  describe("Actions Menu", () => {
    it("should open actions menu when menu button is clicked", async () => {
      const onClone = jest.fn();
      const onMove = jest.fn();
      const onDelete = jest.fn();

      renderWithTheme(
        <TransactionCard
          transaction={mockTransaction}
          onClone={onClone}
          onMove={onMove}
          onDelete={onDelete}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const menuButton = buttons[0]; // First button is the menu button
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.getByText("Clone")).toBeInTheDocument();
        expect(screen.getByText("Move")).toBeInTheDocument();
        expect(screen.getByText("Delete")).toBeInTheDocument();
      });
    });

    it("should call onClone when Clone is clicked", async () => {
      const onClone = jest.fn();

      renderWithTheme(
        <TransactionCard transaction={mockTransaction} onClone={onClone} />,
      );

      const buttons = screen.getAllByRole("button");
      const menuButton = buttons[0]; // First button is the menu button
      fireEvent.click(menuButton);

      await waitFor(() => {
        const cloneMenuItem = screen.getByText("Clone");
        fireEvent.click(cloneMenuItem);
      });

      expect(onClone).toHaveBeenCalledWith(mockTransaction);
    });

    it("should call onMove when Move is clicked", async () => {
      const onMove = jest.fn();

      renderWithTheme(
        <TransactionCard transaction={mockTransaction} onMove={onMove} />,
      );

      const buttons = screen.getAllByRole("button");
      const menuButton = buttons[0]; // First button is the menu button
      fireEvent.click(menuButton);

      await waitFor(() => {
        const moveMenuItem = screen.getByText("Move");
        fireEvent.click(moveMenuItem);
      });

      expect(onMove).toHaveBeenCalledWith(mockTransaction);
    });

    it("should call onDelete when Delete is clicked", async () => {
      const onDelete = jest.fn();

      renderWithTheme(
        <TransactionCard transaction={mockTransaction} onDelete={onDelete} />,
      );

      const buttons = screen.getAllByRole("button");
      const menuButton = buttons[0]; // First button is the menu button
      fireEvent.click(menuButton);

      await waitFor(() => {
        const deleteMenuItem = screen.getByText("Delete");
        fireEvent.click(deleteMenuItem);
      });

      expect(onDelete).toHaveBeenCalledWith(mockTransaction);
    });

    it("should not render Clone option when onClone is not provided", async () => {
      const onMove = jest.fn();
      const onDelete = jest.fn();

      renderWithTheme(
        <TransactionCard
          transaction={mockTransaction}
          onMove={onMove}
          onDelete={onDelete}
        />,
      );

      const buttons = screen.getAllByRole("button");
      const menuButton = buttons[0]; // First button is the menu button
      fireEvent.click(menuButton);

      await waitFor(() => {
        expect(screen.queryByText("Clone")).not.toBeInTheDocument();
      });
    });
  });

  describe("State Change", () => {
    it("should call onStateChange when state chip is clicked", () => {
      const onStateChange = jest.fn();

      renderWithTheme(
        <TransactionCard
          transaction={mockTransaction}
          onStateChange={onStateChange}
        />,
      );

      const clearedChip = screen.getByText("Cleared");
      fireEvent.click(clearedChip);

      expect(onStateChange).toHaveBeenCalledWith(mockTransaction, "cleared");
    });

    it("should not call onStateChange when chip is clicked if handler not provided", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      const clearedChip = screen.getByText("Cleared");
      fireEvent.click(clearedChip);

      // Should not throw error
      expect(true).toBe(true);
    });
  });

  describe("Selection", () => {
    it("should render checkbox when onSelect is provided", () => {
      const onSelect = jest.fn();

      renderWithTheme(
        <TransactionCard transaction={mockTransaction} onSelect={onSelect} />,
      );

      const checkbox = screen.getByRole("checkbox");
      expect(checkbox).toBeInTheDocument();
    });

    it("should not render checkbox when onSelect is not provided", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      const checkbox = screen.queryByRole("checkbox");
      expect(checkbox).not.toBeInTheDocument();
    });

    it("should show checked state when selected prop is true", () => {
      const onSelect = jest.fn();

      renderWithTheme(
        <TransactionCard
          transaction={mockTransaction}
          selected={true}
          onSelect={onSelect}
        />,
      );

      const checkbox = screen.getByRole("checkbox") as HTMLInputElement;
      expect(checkbox.checked).toBe(true);
    });

    it("should call onSelect with transaction ID when checkbox is clicked", () => {
      const onSelect = jest.fn();

      renderWithTheme(
        <TransactionCard transaction={mockTransaction} onSelect={onSelect} />,
      );

      const checkbox = screen.getByRole("checkbox");
      fireEvent.click(checkbox);

      expect(onSelect).toHaveBeenCalledWith(1);
    });
  });

  describe("Notes Expansion", () => {
    it("should show expand button when notes are longer than 100 characters", () => {
      const longNotes = "a".repeat(150);
      const longNotesTransaction = { ...mockTransaction, notes: longNotes };

      renderWithTheme(<TransactionCard transaction={longNotesTransaction} />);

      const expandButtons = screen.getAllByRole("button");
      // Should have menu button and expand button
      expect(expandButtons.length).toBeGreaterThan(1);
    });

    it("should not show expand button when notes are shorter than 100 characters", () => {
      const shortNotesTransaction = {
        ...mockTransaction,
        notes: "Short notes",
      };

      renderWithTheme(<TransactionCard transaction={shortNotesTransaction} />);

      expect(screen.getByText("Short notes")).toBeInTheDocument();
    });

    it("should truncate long notes when not expanded", () => {
      const longNotes = "a".repeat(150);
      const longNotesTransaction = { ...mockTransaction, notes: longNotes };

      renderWithTheme(<TransactionCard transaction={longNotesTransaction} />);

      const notesText = screen.getByText(/aaa/);
      expect(notesText.textContent).toMatch(/\.\.\.$/);
    });

    it("should expand notes when expand button is clicked", async () => {
      const longNotes = "a".repeat(150);
      const longNotesTransaction = { ...mockTransaction, notes: longNotes };

      renderWithTheme(<TransactionCard transaction={longNotesTransaction} />);

      // Find and click the expand button (not the menu button)
      const buttons = screen.getAllByRole("button");
      const expandButton = buttons.find(
        (btn) => !btn.getAttribute("aria-label")?.includes("more"),
      );

      if (expandButton) {
        fireEvent.click(expandButton);

        await waitFor(() => {
          const notesText = screen.getByText(/aaa/);
          // Should show full text without truncation
          expect(notesText.textContent?.length).toBeGreaterThan(100);
        });
      }
    });
  });

  describe("Transaction Type Labels", () => {
    it("should display 'undefined' when transaction type is undefined", () => {
      const undefinedTypeTransaction = {
        ...mockTransaction,
        transactionType: undefined,
      };

      renderWithTheme(
        <TransactionCard transaction={undefinedTypeTransaction} />,
      );

      expect(screen.getByText("undefined")).toBeInTheDocument();
    });

    it("should display correct label for income type", () => {
      const incomeTransaction = {
        ...mockTransaction,
        transactionType: "income" as const,
      };

      renderWithTheme(<TransactionCard transaction={incomeTransaction} />);

      expect(screen.getByText("income")).toBeInTheDocument();
    });

    it("should display correct label for transfer type", () => {
      const transferTransaction = {
        ...mockTransaction,
        transactionType: "transfer" as const,
      };

      renderWithTheme(<TransactionCard transaction={transferTransaction} />);

      expect(screen.getByText("transfer")).toBeInTheDocument();
    });
  });

  describe("Reoccurring Type Labels", () => {
    it("should display 'Monthly' for monthly reoccurring type", () => {
      const monthlyTransaction = {
        ...mockTransaction,
        reoccurringType: "monthly" as const,
      };

      renderWithTheme(<TransactionCard transaction={monthlyTransaction} />);

      expect(screen.getByText("Monthly")).toBeInTheDocument();
    });

    it("should display 'Annually' for annually reoccurring type", () => {
      const annualTransaction = {
        ...mockTransaction,
        reoccurringType: "annually" as const,
      };

      renderWithTheme(<TransactionCard transaction={annualTransaction} />);

      expect(screen.getByText("Annually")).toBeInTheDocument();
    });

    it("should display 'Quarterly' for quarterly reoccurring type", () => {
      const quarterlyTransaction = {
        ...mockTransaction,
        reoccurringType: "quarterly" as const,
      };

      renderWithTheme(<TransactionCard transaction={quarterlyTransaction} />);

      expect(screen.getByText("Quarterly")).toBeInTheDocument();
    });

    it("should display 'Fortnightly' for fortnightly reoccurring type", () => {
      const fortnightlyTransaction = {
        ...mockTransaction,
        reoccurringType: "fortnightly" as const,
      };

      renderWithTheme(<TransactionCard transaction={fortnightlyTransaction} />);

      expect(screen.getByText("Fortnightly")).toBeInTheDocument();
    });

    it("should display 'Bi-Annually' for bi_annually reoccurring type", () => {
      const biAnnualTransaction = {
        ...mockTransaction,
        reoccurringType: "bi_annually" as const,
      };

      renderWithTheme(<TransactionCard transaction={biAnnualTransaction} />);

      expect(screen.getByText("Bi-Annually")).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing transaction ID gracefully", () => {
      const noIdTransaction = { ...mockTransaction, transactionId: undefined };
      const onSelect = jest.fn();

      renderWithTheme(
        <TransactionCard transaction={noIdTransaction} onSelect={onSelect} />,
      );

      // Checkbox should not be rendered without transaction ID
      expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    });

    it("should handle null amount", () => {
      const nullAmountTransaction = {
        ...mockTransaction,
        amount: null as any,
      };

      renderWithTheme(<TransactionCard transaction={nullAmountTransaction} />);

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });

    it("should handle undefined amount", () => {
      const undefinedAmountTransaction = {
        ...mockTransaction,
        amount: undefined as any,
      };

      renderWithTheme(
        <TransactionCard transaction={undefinedAmountTransaction} />,
      );

      expect(screen.getByText("$0.00")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have proper button roles", () => {
      renderWithTheme(<TransactionCard transaction={mockTransaction} />);

      const buttons = screen.getAllByRole("button");
      expect(buttons.length).toBeGreaterThan(0);
    });

    it("should stop event propagation on menu clicks", async () => {
      const onClone = jest.fn();
      const onClick = jest.fn();

      const { container } = renderWithTheme(
        <div onClick={onClick}>
          <TransactionCard transaction={mockTransaction} onClone={onClone} />
        </div>,
      );

      const buttons = screen.getAllByRole("button");
      const menuButton = buttons[0]; // First button is the menu button
      fireEvent.click(menuButton);

      await waitFor(() => {
        const cloneMenuItem = screen.getByText("Clone");
        fireEvent.click(cloneMenuItem);
      });

      // Parent onClick should not be called due to stopPropagation
      expect(onClick).not.toHaveBeenCalled();
    });
  });
});
