import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Register from "../../../pages/register/index";

jest.mock("next/router", () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock("../../../hooks/useUserAccountRegister", () => ({
  __esModule: true,
  default: jest.fn(() => ({
    mutateAsync: jest.fn(),
  })),
}));

// Mock MUI icons
jest.mock("@mui/icons-material", () => ({
  Check: ({ ...props }: any) => (
    <span data-testid="CheckIcon" {...props}>
      ✓
    </span>
  ),
  Close: ({ ...props }: any) => (
    <span data-testid="CloseIcon" {...props}>
      ✗
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
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

// Mock fetch globally
global.fetch = jest.fn();

describe("Register Page", () => {
  beforeEach(() => {
    // Reset fetch mock
    (global.fetch as jest.Mock).mockClear();
  });

  it("renders register form with all required fields", () => {
    render(<Register />, { wrapper: createWrapper() });

    expect(
      screen.getByRole("heading", { name: "Register" }),
    ).toBeInTheDocument();
    expect(document.getElementById("firstName")).toBeInTheDocument();
    expect(document.getElementById("lastName")).toBeInTheDocument();
    expect(document.getElementById("email")).toBeInTheDocument();
    expect(document.getElementById("password")).toBeInTheDocument();
    expect(document.getElementById("confirmPassword")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Register" }),
    ).toBeInTheDocument();
  });

  it("handles form submission correctly", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 201,
      ok: true,
    });

    render(<Register />, { wrapper: createWrapper() });

    const firstNameInput = document.getElementById(
      "firstName",
    ) as HTMLInputElement;
    const lastNameInput = document.getElementById(
      "lastName",
    ) as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;

    // Fill out the form with valid data
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Test123@" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "Test123@" } });

    // Submit the form
    const submitButton = screen.getByRole("button", { name: "Register" });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: "john@example.com",
          password: "Test123@",
          firstName: "John",
          lastName: "Doe",
        }),
        credentials: "include",
      });
    });
  });

  it("prevents submission with invalid password", async () => {
    render(<Register />, { wrapper: createWrapper() });

    const firstNameInput = document.getElementById(
      "firstName",
    ) as HTMLInputElement;
    const lastNameInput = document.getElementById(
      "lastName",
    ) as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;

    // Fill form with weak password
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "weak" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "weak" } });

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(
        screen.getByText("Password does not meet the required criteria."),
      ).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("prevents submission when passwords do not match", async () => {
    render(<Register />, { wrapper: createWrapper() });

    const firstNameInput = document.getElementById(
      "firstName",
    ) as HTMLInputElement;
    const lastNameInput = document.getElementById(
      "lastName",
    ) as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;

    // Fill form with mismatched passwords
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Test123@" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "Different123@" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("handles registration failure with friendly message (400)", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 400,
      ok: false,
    });

    render(<Register />, { wrapper: createWrapper() });

    const firstNameInput = document.getElementById(
      "firstName",
    ) as HTMLInputElement;
    const lastNameInput = document.getElementById(
      "lastName",
    ) as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;

    // Fill form with valid data
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Test123@" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "Test123@" } });

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Some details look off. Please check and try again.",
        ).length,
      ).toBeGreaterThan(0);
    });
  });

  it("handles network error during registration with friendly message", async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(
      new Error("Network error"),
    );

    render(<Register />, { wrapper: createWrapper() });

    const firstNameInput = document.getElementById(
      "firstName",
    ) as HTMLInputElement;
    const lastNameInput = document.getElementById(
      "lastName",
    ) as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;

    // Fill form with valid data
    fireEvent.change(firstNameInput, { target: { value: "John" } });
    fireEvent.change(lastNameInput, { target: { value: "Doe" } });
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "Test123@" } });
    fireEvent.change(confirmPasswordInput, { target: { value: "Test123@" } });

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(
        screen.getAllByText(
          "Unable to connect to the server. Please check your internet connection and try again.",
        ).length,
      ).toBeGreaterThan(0);
    });
  });

  it("handles duplicate email (409) with friendly message", async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 409,
      ok: false,
      json: jest.fn().mockResolvedValue({ error: "User exists" }),
    });

    render(<Register />, { wrapper: createWrapper() });

    fireEvent.change(document.getElementById("firstName") as HTMLInputElement, {
      target: { value: "John" },
    });
    fireEvent.change(document.getElementById("lastName") as HTMLInputElement, {
      target: { value: "Doe" },
    });
    fireEvent.change(document.getElementById("email") as HTMLInputElement, {
      target: { value: "john@example.com" },
    });
    fireEvent.change(document.getElementById("password") as HTMLInputElement, {
      target: { value: "Test123@" },
    });
    fireEvent.change(
      document.getElementById("confirmPassword") as HTMLInputElement,
      {
        target: { value: "Test123@" },
      },
    );

    fireEvent.click(screen.getByRole("button", { name: "Register" }));

    await waitFor(() => {
      expect(
        screen.getAllByText("An account with this email already exists.").length,
      ).toBeGreaterThan(0);
    });
  });

  it("updates form fields correctly", () => {
    render(<Register />, { wrapper: createWrapper() });

    const firstNameInput = document.getElementById(
      "firstName",
    ) as HTMLInputElement;
    const lastNameInput = document.getElementById(
      "lastName",
    ) as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;
    const confirmPasswordInput = document.getElementById(
      "confirmPassword",
    ) as HTMLInputElement;

    fireEvent.change(firstNameInput, { target: { value: "Jane" } });
    fireEvent.change(lastNameInput, { target: { value: "Smith" } });
    fireEvent.change(emailInput, { target: { value: "jane@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "NewPass123@" } });
    fireEvent.change(confirmPasswordInput, {
      target: { value: "NewPass123@" },
    });

    expect(firstNameInput.value).toBe("Jane");
    expect(lastNameInput.value).toBe("Smith");
    expect(emailInput.value).toBe("jane@example.com");
    expect(passwordInput.value).toBe("NewPass123@");
    expect(confirmPasswordInput.value).toBe("NewPass123@");
  });

  it("shows password requirements when password field has value", () => {
    render(<Register />, { wrapper: createWrapper() });

    const passwordInput = document.getElementById(
      "password",
    ) as HTMLInputElement;

    // Initially, password requirements should not be visible
    expect(
      screen.queryByText("Password requirements:"),
    ).not.toBeInTheDocument();

    // Enter password, requirements should appear
    fireEvent.change(passwordInput, { target: { value: "test" } });

    expect(screen.getByText("Password requirements:")).toBeInTheDocument();
    expect(
      screen.getByText("At least one uppercase letter"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("At least one lowercase letter"),
    ).toBeInTheDocument();
    expect(screen.getByText("At least one digit")).toBeInTheDocument();
    expect(
      screen.getByText("At least one special character (@$!%*?&)"),
    ).toBeInTheDocument();

    // Clear password, requirements should disappear
    fireEvent.change(passwordInput, { target: { value: "" } });

    expect(
      screen.queryByText("Password requirements:"),
    ).not.toBeInTheDocument();
  });

  it("renders without errors", () => {
    render(<Register />, { wrapper: createWrapper() });

    // Basic smoke test to ensure component renders
    expect(
      screen.getByRole("heading", { name: "Register" }),
    ).toBeInTheDocument();
  });
});
