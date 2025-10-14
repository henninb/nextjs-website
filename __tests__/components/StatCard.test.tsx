import React from "react";
import { render, screen } from "@testing-library/react";
import StatCard from "../../components/StatCard";
import AccountBalanceIcon from "@mui/icons-material/AccountBalance";

describe("StatCard", () => {
  it("renders with basic props", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Total"
        value="$1,234.56"
        color="primary"
      />,
    );

    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("$1,234.56")).toBeInTheDocument();
  });

  it("renders with numeric value", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Count"
        value={42}
        color="success"
      />,
    );

    expect(screen.getByText("Count")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders with trend indicator (up)", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Growth"
        value="$500.00"
        color="success"
        trend={{ value: 15, direction: "up" }}
      />,
    );

    expect(screen.getByText("Growth")).toBeInTheDocument();
    expect(screen.getByText("$500.00")).toBeInTheDocument();
    expect(screen.getByText(/↑.*15%/)).toBeInTheDocument();
  });

  it("renders with trend indicator (down)", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Decline"
        value="$300.00"
        color="warning"
        trend={{ value: -10, direction: "down" }}
      />,
    );

    expect(screen.getByText("Decline")).toBeInTheDocument();
    expect(screen.getByText("$300.00")).toBeInTheDocument();
    expect(screen.getByText(/↓.*10%/)).toBeInTheDocument();
  });

  it("renders highlighted state with Filtered chip", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Filtered Total"
        value="$1,000.00"
        color="primary"
        highlighted={true}
      />,
    );

    expect(screen.getByText("Filtered Total")).toBeInTheDocument();
    expect(screen.getByText("Filtered")).toBeInTheDocument();
  });

  it("does not render Filtered chip when not highlighted", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Regular Total"
        value="$1,000.00"
        color="primary"
        highlighted={false}
      />,
    );

    expect(screen.getByText("Regular Total")).toBeInTheDocument();
    expect(screen.queryByText("Filtered")).not.toBeInTheDocument();
  });

  it("renders with different color variants", () => {
    const { rerender } = render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Test"
        value="$100"
        color="primary"
      />,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();

    rerender(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Test"
        value="$100"
        color="success"
      />,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();

    rerender(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Test"
        value="$100"
        color="warning"
      />,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();

    rerender(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Test"
        value="$100"
        color="info"
      />,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();

    rerender(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Test"
        value="$100"
        color="secondary"
      />,
    );
    expect(screen.getByText("Test")).toBeInTheDocument();
  });

  it("renders without optional props", () => {
    render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="Simple Card"
        value="$50.00"
      />,
    );

    expect(screen.getByText("Simple Card")).toBeInTheDocument();
    expect(screen.getByText("$50.00")).toBeInTheDocument();
    expect(screen.queryByText("Filtered")).not.toBeInTheDocument();
    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
  });

  it("formats label in uppercase with letter spacing", () => {
    const { container } = render(
      <StatCard
        icon={<AccountBalanceIcon />}
        label="test label"
        value="$100"
      />,
    );

    const labelElement = screen.getByText("test label");
    expect(labelElement).toBeInTheDocument();
    const styles = window.getComputedStyle(labelElement);
    expect(styles.textTransform).toBe("uppercase");
  });
});
