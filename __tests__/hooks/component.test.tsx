import React from "react";
import { render, screen } from "@testing-library/react";

// A simple component to test
const TestComponent: React.FC<{ text: string }> = ({ text }) => {
  return <div data-testid="test-component">{text}</div>;
};

describe("Simple React Component", () => {
  it("renders with the correct text", () => {
    render(<TestComponent text="Hello, Jest!" />);
    const element = screen.getByTestId("test-component");
    expect(element).toHaveTextContent("Hello, Jest!");
  });
});
