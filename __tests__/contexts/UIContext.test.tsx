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

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Test component to access UI context
const TestComponent = () => {
  const { uiMode, toggleUIMode, setUIMode } = useUI();
  
  return (
    <div>
      <div data-testid="current-mode">{uiMode}</div>
      <button data-testid="toggle-btn" onClick={toggleUIMode}>
        Toggle Mode
      </button>
      <button data-testid="set-original-btn" onClick={() => setUIMode("original")}>
        Set Original
      </button>
      <button data-testid="set-modern-btn" onClick={() => setUIMode("modern")}>
        Set Modern
      </button>
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
    it("starts with original mode by default", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
    });

    it("loads saved mode from localStorage", () => {
      localStorage.setItem("financeUIMode", "modern");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });

    it("ignores invalid saved mode in localStorage", () => {
      localStorage.setItem("financeUIMode", "invalid-mode");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
    });
  });

  describe("Toggle Functionality", () => {
    it("toggles from original to modern", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");

      act(() => {
        screen.getByTestId("toggle-btn").click();
      });

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
      expect(localStorage.getItem("financeUIMode")).toBe("modern");
    });

    it("toggles from modern to original", () => {
      localStorage.setItem("financeUIMode", "modern");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");

      act(() => {
        screen.getByTestId("toggle-btn").click();
      });

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
      expect(localStorage.getItem("financeUIMode")).toBe("original");
    });

    it("can toggle multiple times", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      // Original -> Modern
      act(() => {
        screen.getByTestId("toggle-btn").click();
      });
      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");

      // Modern -> Original
      act(() => {
        screen.getByTestId("toggle-btn").click();
      });
      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");

      // Original -> Modern again
      act(() => {
        screen.getByTestId("toggle-btn").click();
      });
      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
    });
  });

  describe("Set Mode Functionality", () => {
    it("can set mode to original explicitly", () => {
      localStorage.setItem("financeUIMode", "modern");

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");

      act(() => {
        screen.getByTestId("set-original-btn").click();
      });

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
      expect(localStorage.getItem("financeUIMode")).toBe("original");
    });

    it("can set mode to modern explicitly", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");

      act(() => {
        screen.getByTestId("set-modern-btn").click();
      });

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
      expect(localStorage.getItem("financeUIMode")).toBe("modern");
    });

    it("setting same mode doesn't cause issues", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");

      act(() => {
        screen.getByTestId("set-original-btn").click();
      });

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
      expect(localStorage.getItem("financeUIMode")).toBe("original");
    });
  });

  describe("LocalStorage Persistence", () => {
    it("persists mode changes to localStorage", () => {
      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      act(() => {
        screen.getByTestId("toggle-btn").click();
      });

      expect(localStorage.getItem("financeUIMode")).toBe("modern");

      act(() => {
        screen.getByTestId("set-original-btn").click();
      });

      expect(localStorage.getItem("financeUIMode")).toBe("original");
    });

    it("handles localStorage errors gracefully", () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      
      localStorage.setItem = jest.fn().mockImplementation(() => {
        throw new Error("Storage quota exceeded");
      });

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      // Should not crash when localStorage throws
      act(() => {
        screen.getByTestId("toggle-btn").click();
      });

      expect(screen.getByTestId("current-mode")).toHaveTextContent("modern");
      expect(consoleWarnSpy).toHaveBeenCalledWith("Failed to save UI mode to localStorage:", expect.any(Error));

      // Restore original localStorage and console
      localStorage.setItem = originalSetItem;
      consoleErrorSpy.mockRestore();
      consoleWarnSpy.mockRestore();
    });
  });

  describe("Context Error Handling", () => {
    it("throws error when useUI is used outside UIProvider", () => {
      const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
      
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
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
      expect(screen.getByTestId("second-mode")).toHaveTextContent("original");

      act(() => {
        screen.getByTestId("toggle-btn").click();
      });

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
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");
    });

    it("handles null localStorage value gracefully", () => {
      // Simulate localStorage returning null
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn().mockReturnValue(null);

      render(
        <UIProvider>
          <TestComponent />
        </UIProvider>
      );

      expect(screen.getByTestId("current-mode")).toHaveTextContent("original");

      // Restore original localStorage
      localStorage.getItem = originalGetItem;
    });
  });
});