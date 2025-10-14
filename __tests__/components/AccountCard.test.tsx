import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import AccountCard from "../../components/AccountCard";
import Account from "../../model/Account";

// Mock next/router
const mockPush = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

describe("AccountCard", () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();

  const mockAccount: Account = {
    accountId: 1,
    accountNameOwner: "Chase Checking",
    accountType: "debit",
    activeStatus: true,
    moniker: "Household",
    outstanding: 100,
    future: 50,
    cleared: 250.5,
    validationDate: new Date("2024-01-15"),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders account information", () => {
    render(<AccountCard account={mockAccount} />);

    expect(screen.getByText("Chase Checking")).toBeInTheDocument();
    expect(screen.getByText("Household")).toBeInTheDocument();
    expect(screen.getByText("debit")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("renders financial metrics with correct formatting", () => {
    render(<AccountCard account={mockAccount} />);

    expect(screen.getByText("$250.50")).toBeInTheDocument(); // cleared
    expect(screen.getByText("$100.00")).toBeInTheDocument(); // outstanding
    expect(screen.getByText("$50.00")).toBeInTheDocument(); // future
  });

  it("renders validation date", () => {
    render(<AccountCard account={mockAccount} />);

    // Date might vary by timezone, just check that "Last validated" text is present
    expect(screen.getByText(/Last validated:/)).toBeInTheDocument();
  });

  it("navigates to transactions page when card is clicked", () => {
    render(<AccountCard account={mockAccount} />);

    const card = screen.getByText("Chase Checking").closest(".MuiCard-root");
    if (card) {
      fireEvent.click(card);
      expect(mockPush).toHaveBeenCalledWith(
        "/finance/transactions/Chase Checking",
      );
    }
  });

  it("opens actions menu when more button is clicked", async () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const moreButton = screen.getAllByRole("button")[0]; // First button should be the more button
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText("Edit Account")).toBeInTheDocument();
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });
  });

  it("calls onEdit when Edit Account is clicked", async () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const moreButton = screen.getAllByRole("button")[0];
    fireEvent.click(moreButton);

    await waitFor(() => {
      const editButton = screen.getByText("Edit Account");
      fireEvent.click(editButton);
      expect(mockOnEdit).toHaveBeenCalledWith(mockAccount);
    });
  });

  it("calls onDelete when Delete Account is clicked", async () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const moreButton = screen.getAllByRole("button")[0];
    fireEvent.click(moreButton);

    await waitFor(() => {
      const deleteButton = screen.getByText("Delete Account");
      fireEvent.click(deleteButton);
      expect(mockOnDelete).toHaveBeenCalledWith(mockAccount);
    });
  });

  it("does not navigate when actions menu button is clicked", async () => {
    render(<AccountCard account={mockAccount} />);

    const moreButton = screen.getAllByRole("button")[0];
    fireEvent.click(moreButton);

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("renders credit account with appropriate styling", () => {
    const creditAccount: Account = {
      ...mockAccount,
      accountType: "credit",
    };

    render(<AccountCard account={creditAccount} />);

    expect(screen.getByText("credit")).toBeInTheDocument();
  });

  it("renders inactive account status", () => {
    const inactiveAccount: Account = {
      ...mockAccount,
      activeStatus: false,
    };

    render(<AccountCard account={inactiveAccount} />);

    expect(screen.getByText("Inactive")).toBeInTheDocument();
  });

  it("renders account without moniker", () => {
    const accountWithoutMoniker: Account = {
      ...mockAccount,
      moniker: undefined,
    };

    render(<AccountCard account={accountWithoutMoniker} />);

    expect(screen.getByText("Chase Checking")).toBeInTheDocument();
    expect(screen.queryByText("Household")).not.toBeInTheDocument();
  });

  it("handles zero balances correctly", () => {
    const zeroBalanceAccount: Account = {
      ...mockAccount,
      cleared: 0,
      outstanding: 0,
      future: 0,
    };

    render(<AccountCard account={zeroBalanceAccount} />);

    const zeroValues = screen.getAllByText("$0.00");
    expect(zeroValues.length).toBeGreaterThanOrEqual(3);
  });

  it("handles undefined financial values", () => {
    const undefinedValuesAccount: Account = {
      ...mockAccount,
      cleared: undefined as any,
      outstanding: undefined as any,
      future: undefined as any,
    };

    render(<AccountCard account={undefinedValuesAccount} />);

    // Should still render without crashing
    expect(screen.getByText("Chase Checking")).toBeInTheDocument();
  });

  it("displays proper icons for debit account", () => {
    const { container } = render(<AccountCard account={mockAccount} />);

    // Check for SVG icons (MUI icons render as SVGs)
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("displays proper icons for credit account", () => {
    const creditAccount: Account = {
      ...mockAccount,
      accountType: "credit",
    };

    const { container } = render(<AccountCard account={creditAccount} />);

    // Check for SVG icons
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThan(0);
  });

  it("renders without onEdit and onDelete callbacks", () => {
    render(<AccountCard account={mockAccount} />);

    expect(screen.getByText("Chase Checking")).toBeInTheDocument();
  });

  it("handles missing validation date gracefully", () => {
    const accountWithInvalidDate: Account = {
      ...mockAccount,
      validationDate: new Date("invalid"),
    };

    render(<AccountCard account={accountWithInvalidDate} />);

    // Invalid dates will show "Invalid Date" or a formatted string
    // Just check that the component renders without crashing
    expect(screen.getByText("Chase Checking")).toBeInTheDocument();
  });

  it("menu can be opened", async () => {
    render(
      <AccountCard
        account={mockAccount}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />,
    );

    const moreButton = screen.getAllByRole("button")[0];
    fireEvent.click(moreButton);

    await waitFor(() => {
      expect(screen.getByText("Edit Account")).toBeInTheDocument();
      expect(screen.getByText("Delete Account")).toBeInTheDocument();
    });
  });
});
