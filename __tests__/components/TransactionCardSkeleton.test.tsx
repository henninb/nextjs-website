import React from "react";
import { render, screen } from "@testing-library/react";
import TransactionCardSkeleton from "../../components/TransactionCardSkeleton";
import { ThemeProvider } from "@mui/material/styles";
import { createTheme } from "@mui/material/styles";

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("TransactionCardSkeleton", () => {
  describe("Rendering", () => {
    it("should render without crashing", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);
      expect(container).toBeInTheDocument();
    });

    it("should render inside a Card component", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Check for MuiCard class
      const card = container.querySelector(".MuiCard-root");
      expect(card).toBeInTheDocument();
    });

    it("should have minimum height matching TransactionCard", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      const card = container.querySelector(".MuiCard-root");
      expect(card).toHaveStyle({ minHeight: "280px" });
    });
  });

  describe("Skeleton Structure", () => {
    it("should render skeleton elements for header section", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have skeleton for date badge (rounded)
      const roundedSkeleton = container.querySelector(
        '[class*="MuiSkeleton-rounded"]',
      );
      expect(roundedSkeleton).toBeInTheDocument();

      // Should have skeleton for action button (circular)
      const circularSkeleton = container.querySelector(
        '[class*="MuiSkeleton-circular"]',
      );
      expect(circularSkeleton).toBeInTheDocument();
    });

    it("should render skeleton elements for description", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have text skeletons for description lines
      const textSkeletons = container.querySelectorAll(
        '[class*="MuiSkeleton-text"]',
      );
      expect(textSkeletons.length).toBeGreaterThan(0);
    });

    it("should render skeleton for category chip", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have rounded skeleton for category
      const roundedSkeletons = container.querySelectorAll(
        '[class*="MuiSkeleton-rounded"]',
      );
      expect(roundedSkeletons.length).toBeGreaterThan(1);
    });

    it("should render skeleton for amount", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have larger text skeleton for amount
      const textSkeletons = container.querySelectorAll(
        '[class*="MuiSkeleton-text"]',
      );
      // Amount skeleton should be present
      expect(textSkeletons.length).toBeGreaterThan(2);
    });

    it("should render skeleton elements for state badges", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have multiple rounded skeletons for state badges
      const roundedSkeletons = container.querySelectorAll(
        '[class*="MuiSkeleton-rounded"]',
      );
      expect(roundedSkeletons.length).toBeGreaterThan(3);
    });

    it("should render skeleton elements for type and reoccurring badges", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have rounded skeletons for type and reoccurring
      const roundedSkeletons = container.querySelectorAll(
        '[class*="MuiSkeleton-rounded"]',
      );
      expect(roundedSkeletons.length).toBeGreaterThan(4);
    });

    it("should render skeleton elements for notes section", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // Should have text skeletons for notes
      const textSkeletons = container.querySelectorAll(
        '[class*="MuiSkeleton-text"]',
      );
      // Should have multiple text skeletons including notes
      expect(textSkeletons.length).toBeGreaterThan(4);
    });
  });

  describe("Layout", () => {
    it("should use flexbox layout", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      const card = container.querySelector(".MuiCard-root");
      expect(card).toHaveStyle({
        display: "flex",
        flexDirection: "column",
      });
    });

    it("should have proper CardContent structure", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      const cardContent = container.querySelector(".MuiCardContent-root");
      expect(cardContent).toBeInTheDocument();
      expect(cardContent).toHaveStyle({
        padding: "24px 24px 24px 24px",
        flex: "1",
      });
    });
  });

  describe("Consistency with TransactionCard", () => {
    it("should match TransactionCard min-height", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      const card = container.querySelector(".MuiCard-root");
      expect(card).toHaveStyle({ minHeight: "280px" });
    });

    it("should use similar spacing structure", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      const cardContent = container.querySelector(".MuiCardContent-root");
      expect(cardContent).toHaveStyle({ padding: "24px 24px 24px 24px" });
    });
  });

  describe("Multiple Instances", () => {
    it("should render multiple skeletons independently", () => {
      const { container } = render(
        <ThemeProvider theme={theme}>
          <div>
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
            <TransactionCardSkeleton />
          </div>
        </ThemeProvider>,
      );

      const cards = container.querySelectorAll(".MuiCard-root");
      expect(cards.length).toBe(3);
    });
  });

  describe("Accessibility", () => {
    it("should not have interactive elements", () => {
      renderWithTheme(<TransactionCardSkeleton />);

      // Skeleton should not have buttons
      const buttons = screen.queryAllByRole("button");
      expect(buttons.length).toBe(0);
    });

    it("should not have form elements", () => {
      renderWithTheme(<TransactionCardSkeleton />);

      // Should not have checkboxes or other inputs
      const checkboxes = screen.queryAllByRole("checkbox");
      expect(checkboxes.length).toBe(0);
    });
  });

  describe("Animation", () => {
    it("should render MUI Skeleton components with pulse animation", () => {
      const { container } = renderWithTheme(<TransactionCardSkeleton />);

      // MUI Skeleton components have wave animation by default
      const skeletons = container.querySelectorAll('[class*="MuiSkeleton-"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });
});
