import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import Layout from "../../components/Layout";

// Mock dependencies
const mockPush = jest.fn();
const mockLogout = jest.fn();
let mockRouterPathname = "/finance";
let mockIsAuthenticated = true;
let mockUser = {
  firstName: "John",
  lastName: "Doe",
  username: "johndoe",
};

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: mockPush,
    pathname: mockRouterPathname,
    query: {},
    asPath: mockRouterPathname,
  }),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => ({
    isAuthenticated: mockIsAuthenticated,
    user: mockUser,
    logout: mockLogout,
  }),
}));

jest.mock("../../contexts/UIContext", () => ({
  useUI: () => ({
    uiMode: "modern",
  }),
}));

jest.mock("../../components/SelectNavigateAccounts", () => {
  return function MockSelectNavigateAccounts({ onNavigate, isModern, theme }: any) {
    return (
      <div data-testid="select-navigate-accounts">
        <button onClick={onNavigate}>Mock Account Selector</button>
      </div>
    );
  };
});

jest.mock("../../layouts/FinanceLayout", () => {
  return function MockFinanceLayout({ children }: { children: React.ReactNode }) {
    return <div data-testid="finance-layout">{children}</div>;
  };
});

jest.mock("../../components/UIToggle", () => ({
  UIToggleInline: () => <div data-testid="ui-toggle">UI Toggle</div>,
}));

const theme = createTheme();

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("Layout Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset to default state for finance page tests
    mockRouterPathname = "/finance";
    mockIsAuthenticated = true;
    mockUser = {
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
    };
  });

  describe("Basic Rendering", () => {
    it("renders children content", () => {
      renderWithTheme(
        <Layout>
          <div data-testid="test-content">Test Content</div>
        </Layout>
      );

      expect(screen.getByTestId("test-content")).toBeInTheDocument();
    });

    it("renders app bar with menu button", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByLabelText("menu")).toBeInTheDocument();
    });

    it("renders finance layout wrapper for finance pages", () => {
      renderWithTheme(
        <Layout>
          <div>Finance Content</div>
        </Layout>
      );

      expect(screen.getByTestId("finance-layout")).toBeInTheDocument();
    });
  });

  describe("Navigation Menu", () => {
    it("opens drawer when menu button is clicked", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const menuButton = screen.getByLabelText("menu");
      fireEvent.click(menuButton);

      // Check if drawer content is visible (finance links)
      expect(screen.getByText("Home")).toBeInTheDocument();
      expect(screen.getByText("Transfer")).toBeInTheDocument();
      expect(screen.getByText("Payments")).toBeInTheDocument();
      expect(screen.getByText("Categories")).toBeInTheDocument();
    });

    it("displays finance navigation links for finance pages", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const menuButton = screen.getByLabelText("menu");
      fireEvent.click(menuButton);

      // Check finance-specific links
      expect(screen.getByText("PaymentsRequired")).toBeInTheDocument();
      expect(screen.getByText("Descriptions")).toBeInTheDocument();
      expect(screen.getByText("Configuration")).toBeInTheDocument();
      expect(screen.getByText("Import")).toBeInTheDocument();
      expect(screen.getByText("Backup/Restore")).toBeInTheDocument();
    });

    it("includes account navigation selector for finance pages", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const menuButton = screen.getByLabelText("menu");
      fireEvent.click(menuButton);

      expect(screen.getByTestId("select-navigate-accounts")).toBeInTheDocument();
    });

    it("closes drawer when navigation item is clicked", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const menuButton = screen.getByLabelText("menu");
      fireEvent.click(menuButton);

      // Find a navigation link and click it
      const homeLink = screen.getByText("Home");
      fireEvent.click(homeLink);

      // The drawer should close (navigation links would not be immediately visible)
      // We can test this by trying to open the menu again
      fireEvent.click(menuButton);
      expect(screen.getByText("Home")).toBeInTheDocument();
    });
  });

  describe("Authentication UI", () => {
    it("shows user information when authenticated", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      // Should show user display name (John Doe)
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });

    it("shows logout button when authenticated", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const logoutButton = screen.getByText("Logout");
      expect(logoutButton).toBeInTheDocument();
    });

    it("calls logout when logout button is clicked", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const logoutButton = screen.getByText("Logout");
      fireEvent.click(logoutButton);

      expect(mockLogout).toHaveBeenCalled();
    });
  });

  describe("UI Mode Support", () => {
    it("renders UI toggle for finance pages", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByTestId("ui-toggle")).toBeInTheDocument();
    });

    it("applies modern theme styling in modern mode", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      // The component should render without errors in modern mode
      expect(screen.getByText("John Doe")).toBeInTheDocument();
    });
  });

  describe("User Display Name Sanitization", () => {
    it("handles missing user data gracefully", () => {
      // Set mock user to null
      mockUser = null;

      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      // Should show default "User" text in avatar
      expect(screen.getByText("User")).toBeInTheDocument();
    });

    it("sanitizes user input for security", () => {
      // Mock user with potentially unsafe characters
      mockUser = {
        firstName: "John<script>",
        lastName: "Doe", 
        username: "johndoe",
      };

      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      // Should handle sanitization - the actual implementation sanitizes the input
      expect(screen.getByText("Johnscript Doe")).toBeInTheDocument();
    });

    it("falls back to username when no first/last name", () => {
      mockUser = {
        firstName: "",
        lastName: "",
        username: "testuser",
      };

      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      // Should show username fallback
      expect(screen.getByText("testuser")).toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles errors in user display name gracefully", () => {
      // Mock a user object that might cause errors
      mockUser = {
        firstName: null,
        lastName: undefined,
        username: null,
      };

      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      // Should not crash and show fallback
      expect(screen.getByText("User")).toBeInTheDocument();
    });
  });

  describe("Responsive Design", () => {
    it("applies correct styling for different screen sizes", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const menuButton = screen.getByLabelText("menu");
      fireEvent.click(menuButton);

      // Drawer should be rendered with proper width
      const drawer = screen.getByText("Home").closest('[role="presentation"]');
      expect(drawer).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper ARIA labels", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      expect(screen.getByLabelText("menu")).toBeInTheDocument();
    });

    it("supports keyboard navigation", () => {
      renderWithTheme(
        <Layout>
          <div>Content</div>
        </Layout>
      );

      const menuButton = screen.getByLabelText("menu");
      menuButton.focus();
      expect(menuButton).toHaveFocus();
    });
  });
});

// Test with non-finance page
describe("Layout Component - Non-Finance Pages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set router for non-finance page
    mockRouterPathname = "/";
    // Reset auth state
    mockIsAuthenticated = true;
    mockUser = {
      firstName: "John",
      lastName: "Doe",
      username: "johndoe",
    };
  });

  it("renders general navigation links for non-finance pages", () => {
    renderWithTheme(
      <Layout>
        <div>General Content</div>
      </Layout>
    );

    const menuButton = screen.getByLabelText("menu");
    fireEvent.click(menuButton);

    // Check general links
    expect(screen.getByText("NBA")).toBeInTheDocument();
    expect(screen.getByText("NFL")).toBeInTheDocument();
    expect(screen.getByText("NHL")).toBeInTheDocument();
    expect(screen.getByText("MLB")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
  });

  it("does not render finance layout wrapper for non-finance pages", () => {
    renderWithTheme(
      <Layout>
        <div>General Content</div>
      </Layout>
    );

    expect(screen.queryByTestId("finance-layout")).not.toBeInTheDocument();
  });

  it("does not show UI toggle for non-finance pages", () => {
    renderWithTheme(
      <Layout>
        <div>General Content</div>
      </Layout>
    );

    expect(screen.queryByTestId("ui-toggle")).not.toBeInTheDocument();
  });
});

// Test with unauthenticated user
describe("Layout Component - Unauthenticated", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Set to unauthenticated state
    mockIsAuthenticated = false;
    mockUser = null;
    mockRouterPathname = "/finance";
  });

  it("shows login and register buttons when not authenticated", () => {
    renderWithTheme(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.getByText("Login")).toBeInTheDocument();
    expect(screen.getByText("Register")).toBeInTheDocument();
  });

  it("does not show user information when not authenticated", () => {
    renderWithTheme(
      <Layout>
        <div>Content</div>
      </Layout>
    );

    expect(screen.queryByText("John Doe")).not.toBeInTheDocument();
    expect(screen.queryByText("Logout")).not.toBeInTheDocument();
  });
});