import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../../pages/login/index";

// Router mock with shared push spy
const pushMock = jest.fn();
jest.mock("next/router", () => ({
  useRouter: () => ({
    push: pushMock,
  }),
}));

// Mock AuthProvider's useAuth to avoid needing a real provider
const loginMock = jest.fn();
jest.mock("../../../components/AuthProvider", () => ({
  __esModule: true,
  useAuth: () => ({
    isAuthenticated: false,
    user: null,
    loading: false,
    login: loginMock,
    logout: jest.fn(),
  }),
}));

// Mock MUI icons to simple spans for stability
jest.mock("@mui/icons-material", () => ({
  Email: ({ ...props }: any) => (
    <span data-testid="EmailIcon" {...props}>
      ✉️
    </span>
  ),
  Lock: ({ ...props }: any) => (
    <span data-testid="LockIcon" {...props}>
      🔒
    </span>
  ),
  Visibility: ({ ...props }: any) => (
    <span data-testid="VisibilityIcon" {...props}>
      👁️
    </span>
  ),
  VisibilityOff: ({ ...props }: any) => (
    <span data-testid="VisibilityOffIcon" {...props}>
      🙈
    </span>
  ),
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("Login Page", () => {
  beforeEach(() => {
    (global.fetch as jest.Mock).mockClear();
    pushMock.mockClear();
    loginMock.mockClear();
  });

  it("renders login form with required fields", () => {
    render(<Login />);

    expect(screen.getByRole("heading", { name: "Login" })).toBeInTheDocument();
    expect(document.getElementById("email")).toBeInTheDocument();
    expect(document.getElementById("password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign In" })).toBeInTheDocument();
  });

  it("disables submit until fields are filled", () => {
    render(<Login />);

    const submit = screen.getByRole("button", { name: "Sign In" });
    expect(submit).toBeDisabled();

    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "john@example.com" },
    });
    expect(submit).toBeDisabled();

    fireEvent.change(document.getElementById("password") as HTMLInputElement, {
      target: { value: "Test123@" },
    });
    expect(submit).not.toBeDisabled();
  });

  it("toggles password visibility", () => {
    render(<Login />);

    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    expect(passwordInput.type).toBe("password");

    const toggle = screen.getByLabelText("toggle password visibility");
    fireEvent.click(toggle);
    expect(passwordInput.type).toBe("text");

    fireEvent.click(toggle);
    expect(passwordInput.type).toBe("password");
  });

  it("handles successful login and navigates", async () => {
    // First call: /api/login
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 200,
      ok: true,
    });
    // Second call: /api/me
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        username: "john@example.com",
        firstName: "John",
        lastName: "Doe",
      }),
    });

    render(<Login />);

    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "john@example.com" },
    });
    fireEvent.change(document.getElementById("password") as HTMLInputElement, {
      target: { value: "Test123@" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "john@example.com",
          password: "Test123@",
          firstName: "Joe",
          lastName: "User",
        }),
        credentials: "include",
      });
      expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/me", {
        credentials: "include",
      });
      expect(loginMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/finance");
    });
  });

  it("shows friendly message on invalid credentials (400/401/403)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 401,
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Unauthorized" }),
    });

    render(<Login />);

    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "john@example.com" },
    });
    fireEvent.change(document.getElementById("password") as HTMLInputElement, {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password.")).toBeInTheDocument();
      // Only /api/login attempted
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  it("shows permission message on 403", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 403,
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "Forbidden" }),
    });

    render(<Login />);

    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "john@example.com" },
    });
    fireEvent.change(document.getElementById("password") as HTMLInputElement, {
      target: { value: "bad" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(
        screen.getByText("You don't have access to this account."),
      ).toBeInTheDocument();
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(pushMock).not.toHaveBeenCalled();
    });
  });

  it("shows friendly network error message on network failure", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<Login />);

    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "john@example.com" },
    });
    fireEvent.change(document.getElementById("password") as HTMLInputElement, {
      target: { value: "Test123@" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Sign In" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Unable to connect to the server. Please check your internet connection and try again.",
        ),
      ).toBeInTheDocument();
      expect(pushMock).not.toHaveBeenCalled();
    });
  });
});
