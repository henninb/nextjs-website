import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import TotalsBreakdownModal from "../../components/TotalsBreakdownModal";

describe("TotalsBreakdownModal", () => {
  it("renders each row and the computed sum", () => {
    render(
      <TotalsBreakdownModal
        open={true}
        onClose={jest.fn()}
        title="Cleared Breakdown"
        rows={[
          { accountNameOwner: "checking_brian", amount: 100 },
          { accountNameOwner: "savings_brian", amount: 50 },
        ]}
        total={150}
      />,
    );

    expect(screen.getByText("Cleared Breakdown")).toBeInTheDocument();
    expect(screen.getByText("checking_brian")).toBeInTheDocument();
    expect(screen.getByText("savings_brian")).toBeInTheDocument();
    expect(screen.getByText("Sum")).toBeInTheDocument();
    expect(screen.getAllByText("$150.00").length).toBeGreaterThan(0);
    expect(screen.queryByText(/may differ slightly/i)).not.toBeInTheDocument();
  });

  it("shows an empty state when there are no rows", () => {
    render(
      <TotalsBreakdownModal
        open={true}
        onClose={jest.fn()}
        title="Future Breakdown"
        rows={[]}
        total={0}
      />,
    );

    expect(
      screen.getByText("No accounts contribute to this total."),
    ).toBeInTheDocument();
  });

  it("flags a mismatch between the computed sum and the card total", () => {
    render(
      <TotalsBreakdownModal
        open={true}
        onClose={jest.fn()}
        title="Outstanding Breakdown"
        rows={[{ accountNameOwner: "credit_brian", amount: 75 }]}
        total={100}
      />,
    );

    expect(screen.getByText(/may differ slightly/i)).toBeInTheDocument();
  });

  it("calls onClose when Close is clicked", () => {
    const onClose = jest.fn();
    render(
      <TotalsBreakdownModal
        open={true}
        onClose={onClose}
        title="Cleared Breakdown"
        rows={[{ accountNameOwner: "checking_brian", amount: 100 }]}
        total={100}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
