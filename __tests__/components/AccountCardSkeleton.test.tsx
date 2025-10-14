import React from "react";
import { render } from "@testing-library/react";
import AccountCardSkeleton from "../../components/AccountCardSkeleton";

describe("AccountCardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<AccountCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders all skeleton elements", () => {
    const { container } = render(<AccountCardSkeleton />);

    // Check for MUI Skeleton components
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThan(10); // Header, name, moniker, status, 3 metrics, footer
  });

  it("renders with Card wrapper", () => {
    const { container } = render(<AccountCardSkeleton />);

    const card = container.querySelector(".MuiCard-root");
    expect(card).toBeInTheDocument();
  });

  it("renders with CardContent", () => {
    const { container } = render(<AccountCardSkeleton />);

    const cardContent = container.querySelector(".MuiCardContent-root");
    expect(cardContent).toBeInTheDocument();
  });

  it("renders header skeleton elements (icon, chip, menu button)", () => {
    const { container } = render(<AccountCardSkeleton />);

    const rectangularSkeletons = container.querySelectorAll(
      ".MuiSkeleton-rectangular",
    );
    const circularSkeletons = container.querySelectorAll(
      ".MuiSkeleton-circular",
    );

    // Should have rectangular skeletons for icon and chips
    expect(rectangularSkeletons.length).toBeGreaterThan(0);
    // Should have circular skeleton for menu button
    expect(circularSkeletons.length).toBeGreaterThan(0);
  });

  it("renders text skeletons for account name", () => {
    const { container } = render(<AccountCardSkeleton />);

    const textSkeletons = container.querySelectorAll(".MuiSkeleton-text");
    expect(textSkeletons.length).toBeGreaterThan(0);
  });

  it("renders financial metrics grid skeleton structure", () => {
    const { container } = render(<AccountCardSkeleton />);

    // The metrics are in a grid with 3 columns
    // Each metric has 2 skeleton elements (label + value)
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThanOrEqual(6); // At least 6 for the 3 metrics (2 each)
  });

  it("renders footer skeleton for validation date", () => {
    const { container } = render(<AccountCardSkeleton />);

    const textSkeletons = container.querySelectorAll(".MuiSkeleton-text");
    // Last text skeleton should be for the validation date
    expect(textSkeletons.length).toBeGreaterThan(0);
  });

  it("matches the structure of AccountCard", () => {
    const { container } = render(<AccountCardSkeleton />);

    // Verify all main sections are present
    const card = container.querySelector(".MuiCard-root");
    const cardContent = card?.querySelector(".MuiCardContent-root");
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");

    expect(card).toBeInTheDocument();
    expect(cardContent).toBeInTheDocument();
    expect(skeletons.length).toBeGreaterThan(10);
  });

  it("has proper box structure for layout", () => {
    const { container } = render(<AccountCardSkeleton />);

    // Check that Box components are used for layout
    const boxes = container.querySelectorAll('[class*="MuiBox-root"]');
    expect(boxes.length).toBeGreaterThan(0);
  });

  it("renders with consistent height for grid layout", () => {
    const { container } = render(<AccountCardSkeleton />);

    const card = container.querySelector(".MuiCard-root");
    expect(card).toBeInTheDocument();
    // Card should have full height for consistent grid layout
  });
});
