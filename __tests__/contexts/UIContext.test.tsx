import React from "react";
import { render, screen, act } from "@testing-library/react";
import { UIProvider, useUI } from "../../contexts/UIContext";

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

// Test component to access UI context
const TestComponent = () => {
  const { uiMode } = useUI();

  return (
    <div>
      <div data-testid="current-mode">{uiMode}</div>
    </div>
  );
};

describe("UIContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initial State", () => {
    it("starts with modern mode by default", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });

    it("always uses modern mode regardless of localStorage", () => {
      localStorage.setItem("financeUIMode", "original");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });

    it("ignores invalid saved mode in localStorage", () => {
      localStorage.setItem("financeUIMode", "invalid-mode");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });
  });

  describe("Modern Theme Only", () => {
    it("always returns modern theme", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });

    it("maintains modern theme across re-renders", () => {
      const { rerender } = render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");

      rerender(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });
  });

  describe("Context Error Handling", () => {
    it("throws error when useUI is used outside UIProvider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useUI must be used within a UIProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("Multiple Instances", () => {
    it("supports multiple child components accessing the same context", () => {
      const SecondTestComponent = () => {
        const { uiMode } = useUI();
        return <div data-testid="second-mode">{uiMode}</div>;
      };

      render(
        <UIProvider>
          <TestComponent />
          <SecondTestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
      expect(screen.getByTestId("second-mode")).toHaveTextContent("modern");
    });
  });

  describe("Edge Cases", () => {
    it("handles empty localStorage gracefully", () => {
      localStorage.removeItem("financeUIMode");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });

    it("handles null localStorage value gracefully", () => {
      // Simulate localStorage returning null
      const originalGetItem = localStorage.getItem;
      // @ts-expect-error
      localStorage.getItem = jest.fn().mockReturnValue(null);

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>,
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");

      // Restore original localStorage
      // @ts-expect-error
      localStorage.getItem = originalGetItem;
    });
  });
});
