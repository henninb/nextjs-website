import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { useRouter } from "next/navigation";
import AuthProvider, { useAuth } from "../../components/AuthProvider";
import * as useLogoutProcess from "../../hooks/useLogoutProcess";

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn().mockReturnValue("/finance"),
}));

jest.mock("../../hooks/useLogoutProcess");

const mockPush = jest.fn();
const mockLogoutNow = jest.fn();

// Test component to access auth context
const TestComponent = () => {
  const { isAuthenticated, user, loading, login, logout } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {loading
          ? "loading"
          : isAuthenticated
            ? "authenticated"
            : "unauthenticated"}
      </div>
      <div data-testid="user-data">{user ? user.username : "no-user"}</div>
      <button
        data-testid="login-btn"
        onClick={() => login({ username: "testuser", password: "" })}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>
        Logout
      </button>
    </div>
  );
};

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe("AuthProvider Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useLogoutProcess.default as jest.Mock).mockReturnValue({
      logoutNow: mockLogoutNow,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial Loading State", () => {
    it("starts in loading state", async () => {
      mockFetch.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100)),
      );

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      expect(screen.getByTestId("auth-status")).toHaveTextContent("loading");
    });
  });

  describe("Successful Authentication", () => {
    it("authenticates user when /api/me returns user data", async () => {
      const userData = { username: "testuser", id: 1 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(userData),
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "authenticated",
        );
        expect(screen.getByTestId("user-data")).toHaveTextContent("testuser");
      });

      expect(mockFetch).toHaveBeenCalledWith("/api/me", {
        credentials: "include",
      });
    });
  });

  describe("Failed Authentication", () => {
    it("handles failed authentication when /api/me returns error", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
        expect(screen.getByTestId("user-data")).toHaveTextContent("no-user");
      });
    });

    it("handles network errors gracefully", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
        expect(screen.getByTestId("user-data")).toHaveTextContent("no-user");
      });
    });
  });

  describe("Login Functionality", () => {
    it("allows manual login with user data", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 401,
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
      });

      await act(async () => {
        screen.getByTestId("login-btn").click();
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "authenticated",
        );
        expect(screen.getByTestId("user-data")).toHaveTextContent("testuser");
      });
    });
  });

  describe("Logout Functionality", () => {
    it("logs out user and redirects to login page", async () => {
      const userData = { username: "testuser", id: 1 };
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(userData),
      });

      mockLogoutNow.mockResolvedValue({});

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "authenticated",
        );
      });

      await act(async () => {
        screen.getByTestId("logout-btn").click();
      });

      await waitFor(() => {
        expect(mockLogoutNow).toHaveBeenCalled();
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
        expect(screen.getByTestId("user-data")).toHaveTextContent("no-user");
        expect(mockPush).toHaveBeenCalledWith("/login");
      });
    });
  });

  describe("Context Error Handling", () => {
    it("throws error when useAuth is used outside AuthProvider", () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow("useAuth must be used within an AuthProvider");

      consoleSpy.mockRestore();
    });
  });

  describe("API Integration", () => {
    it("makes API call with correct credentials", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({ username: "test" }),
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith("/api/me", {
          credentials: "include",
        });
      });
    });

    it("handles different response status codes", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 403,
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
      });
    });
  });

  describe("Loading State Management", () => {
    it("properly transitions from loading to authenticated state", async () => {
      const userData = { username: "testuser", id: 1 };
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: jest.fn().mockResolvedValue(userData),
                }),
              10,
            ),
          ),
      );

      let component: any;
      await act(async () => {
        component = render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      // Initially loading
      expect(screen.getByTestId("auth-status")).toHaveTextContent("loading");

      // Then authenticated after API call
      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "authenticated",
        );
      });
    });

    it("properly transitions from loading to unauthenticated state", async () => {
      mockFetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: false,
                  status: 401,
                }),
              10,
            ),
          ),
      );

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      // Initially loading
      expect(screen.getByTestId("auth-status")).toHaveTextContent("loading");

      // Then unauthenticated after API call
      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles malformed JSON responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "unauthenticated",
        );
      });
    });

    it("handles empty user responses", async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue(null),
      });

      await act(async () => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>,
        );
      });

      await waitFor(() => {
        expect(screen.getByTestId("auth-status")).toHaveTextContent(
          "authenticated",
        );
        expect(screen.getByTestId("user-data")).toHaveTextContent("no-user");
      });
    });
  });
});
