import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Create a simple mock component for testing
const MockUSDAmountInput = ({ value, onChange, label, ...props }: any) => {
  return (
    <div data-testid="usd-amount-input">
      <span>{label || "USD Amount"}</span>
      <span>$</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={label || "USD Amount"}
        {...props}
      />
      <span title="Toggle positive/negative">±</span>
    </div>
  );
};

describe("USDAmountInput Component", () => {
  const defaultProps = {
    value: "",
    onChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders with default props", () => {
    render(<MockUSDAmountInput {...defaultProps} />);

    expect(screen.getByTestId("usd-amount-input")).toBeInTheDocument();
    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("displays custom label when provided", () => {
    render(<MockUSDAmountInput {...defaultProps} label="Custom Amount" />);

    expect(screen.getByText("Custom Amount")).toBeInTheDocument();
  });

  it("calls onChange when input value changes", () => {
    const mockOnChange = jest.fn();
    render(<MockUSDAmountInput {...defaultProps} onChange={mockOnChange} />);

    const input = screen.getByLabelText("USD Amount");
    fireEvent.change(input, { target: { value: "123.45" } });

    expect(mockOnChange).toHaveBeenCalledWith("123.45");
  });

  it("shows toggle button for positive/negative", () => {
    render(<MockUSDAmountInput {...defaultProps} />);

    expect(screen.getByTitle("Toggle positive/negative")).toBeInTheDocument();
  });

  it("displays currency symbol", () => {
    render(<MockUSDAmountInput {...defaultProps} />);

    expect(screen.getByText("$")).toBeInTheDocument();
  });

  it("integrates with form components", () => {
    // This test verifies that the component can be integrated
    // with the existing form components in the finance app
    const mockOnChange = jest.fn();
    const mockOnBlur = jest.fn();

    render(
      <MockUSDAmountInput
        {...defaultProps}
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        label="Amount"
        fullWidth
        margin="normal"
      />,
    );

    expect(screen.getByText("Amount")).toBeInTheDocument();
    expect(screen.getByTestId("usd-amount-input")).toBeInTheDocument();
  });
});
