import React from "react";
import { render } from "@testing-library/react";
import StatCardSkeleton from "../../components/StatCardSkeleton";

describe("StatCardSkeleton", () => {
  it("renders without crashing", () => {
    const { container } = render(<StatCardSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders all skeleton elements", () => {
    const { container } = render(<StatCardSkeleton />);

    // Check for MUI Skeleton components
    const skeletons = container.querySelectorAll(".MuiSkeleton-root");
    expect(skeletons.length).toBeGreaterThanOrEqual(3); // Icon, label, and value skeletons
  });

  it("renders with Card wrapper", () => {
    const { container } = render(<StatCardSkeleton />);

    // Check for MUI Card component
    const card = container.querySelector(".MuiCard-root");
    expect(card).toBeInTheDocument();
  });

  it("renders with CardContent", () => {
    const { container } = render(<StatCardSkeleton />);

    // Check for MUI CardContent component
    const cardContent = container.querySelector(".MuiCardContent-root");
    expect(cardContent).toBeInTheDocument();
  });

  it("renders rectangular skeleton for icon", () => {
    const { container } = render(<StatCardSkeleton />);

    // Check for rectangular skeleton (icon box)
    const rectangularSkeleton = container.querySelector(
      ".MuiSkeleton-rectangular",
    );
    expect(rectangularSkeleton).toBeInTheDocument();
  });

  it("renders text skeletons for label and value", () => {
    const { container } = render(<StatCardSkeleton />);

    // Check for text skeletons
    const textSkeletons = container.querySelectorAll(".MuiSkeleton-text");
    expect(textSkeletons.length).toBeGreaterThanOrEqual(2); // Label and value
  });

  it("matches the structure of StatCard", () => {
    const { container } = render(<StatCardSkeleton />);

    // Verify the skeleton has the same card structure
    const card = container.querySelector(".MuiCard-root");
    const cardContent = card?.querySelector(".MuiCardContent-root");
    const skeletons = cardContent?.querySelectorAll(".MuiSkeleton-root");

    expect(card).toBeInTheDocument();
    expect(cardContent).toBeInTheDocument();
    expect(skeletons?.length).toBeGreaterThan(0);
  });
});
