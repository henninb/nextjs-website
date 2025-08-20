import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock router
jest.mock("next/router", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Stub ResizeObserver used by some MUI internals
beforeAll(() => {
  // @ts-ignore
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock MUI DataGrid to simplify DOM
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: () => <div data-testid="mocked-datagrid">Mocked DataGrid</div>,
}));

// Mock EmptyState component
jest.mock("../../../components/EmptyState", () => ({
  __esModule: true,
  default: ({ title, message, onAction, onRefresh }: any) => (
    <div data-testid="empty-state">
      <div>{title}</div>
      <div>{message}</div>
      {onAction && <button onClick={onAction}>Create</button>}
      {onRefresh && <button onClick={onRefresh}>Refresh</button>}
    </div>
  ),
}));

// Mock auth
jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

// Mock hooks used by the page
jest.mock("../../../hooks/useParameterFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
const insertParameterMock = jest.fn().mockResolvedValue({});
jest.mock("../../../hooks/useParameterInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: insertParameterMock }),
}));
jest.mock("../../../hooks/useParameterUpdate", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));
jest.mock("../../../hooks/useParameterDelete", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
}));

import ConfigurationPage from "../../../pages/finance/configuration";
import useParameterFetchMock from "../../../hooks/useParameterFetch";
import { useAuth as useAuthMock } from "../../../components/AuthProvider";

// Mock localStorage for offline functionality tests
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

describe("pages/finance/configuration", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUseParameterFetch = useParameterFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset localStorage mocks
    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
    });
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { writable: true, value: true });
  });

  it("renders error display when parameters fail to load", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    const refetch = jest.fn();
    mockUseParameterFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: false,
      isError: true,
      error: new Error("failed"),
      refetch,
    });

    render(<ConfigurationPage />);
    const tryAgain = screen.getByRole("button", { name: /try again/i });
    expect(tryAgain).toBeInTheDocument();
    fireEvent.click(tryAgain);
    expect(refetch).toHaveBeenCalled();
  });

  it("shows add parameter modal when clicking Add Parameter", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    // Provide at least one row to avoid EmptyState branch (icon tree issues in JSDOM)
    mockUseParameterFetch.mockReturnValue({
      data: [
        {
          parameterId: "p1",
          parameterName: "payment_account",
          parameterValue: "Chase",
        },
      ],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);

    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    expect(screen.getByText(/Add New Parameter/i)).toBeInTheDocument();
  });

  it("adds a parameter (happy path)", async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterId: "id1", parameterName: "x", parameterValue: "y" }],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "key" },
    });
    fireEvent.change(screen.getByLabelText(/value/i), {
      target: { value: "val" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertParameterMock).toHaveBeenCalled();
    expect(
      await screen.findByText(/Configuration added successfully/i),
    ).toBeInTheDocument();
  });

  it("shows error when add parameter fails", async () => {
    insertParameterMock.mockRejectedValueOnce(new Error("Server error"));
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterId: "id1", parameterName: "x", parameterValue: "y" }],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "k" },
    });
    fireEvent.change(screen.getByLabelText(/value/i), {
      target: { value: "v" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertParameterMock).toHaveBeenCalled();
    expect(
      await screen.findByText(/Add Configuration: Server error/i),
    ).toBeInTheDocument();
  });

  it("does not submit when Add Parameter form is empty", () => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterId: "id1", parameterName: "x", parameterValue: "y" }],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    // No input changes; clicking Add should not call insert and shows validation
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    expect(insertParameterMock).not.toHaveBeenCalled();
    expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Value is required/i)).toBeInTheDocument();
  });

  it("submits parameter with long name (no validation constraints)", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterId: "id1", parameterName: "x", parameterValue: "y" }],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    
    // Test long name - should be accepted
    const longName = "a".repeat(101);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: longName },
    });
    fireEvent.change(screen.getByLabelText(/value/i), {
      target: { value: "valid_value" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    
    expect(insertParameterMock).toHaveBeenCalled();
  });

  it("submits parameter with long value (no validation constraints)", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [{ parameterId: "id1", parameterName: "x", parameterValue: "y" }],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    
    // Test long value - should be accepted
    const longValue = "a".repeat(501);
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "valid_name" },
    });
    fireEvent.change(screen.getByLabelText(/value/i), {
      target: { value: longValue },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    
    expect(insertParameterMock).toHaveBeenCalled();
  });

  it("shows loading state while fetching parameters", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: null,
      isSuccess: false,
      isLoading: true,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    expect(screen.getByText(/Loading configuration/i)).toBeInTheDocument();
  });

  it("shows empty state when no parameters exist", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    // Configuration page shows empty state component
    expect(screen.getByTestId("empty-state")).toBeInTheDocument();
    expect(screen.getByText(/No Parameters Found/i)).toBeInTheDocument();
  });

  it("loads offline parameters from localStorage on mount", () => {
    const offlineData = JSON.stringify([
      { parameterId: "offline1", parameterName: "offline_param", parameterValue: "offline_value" }
    ]);
    mockLocalStorage.getItem.mockReturnValue(offlineData);
    
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith("offlineParameters");
  });

  it("handles offline parameter creation when navigator is offline", async () => {
    // Set navigator offline
    Object.defineProperty(navigator, 'onLine', { writable: true, value: false });
    insertParameterMock.mockRejectedValue(new Error("Failed to fetch"));
    
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    fireEvent.click(screen.getByRole("button", { name: /add parameter/i }));
    fireEvent.change(screen.getByLabelText(/name/i), {
      target: { value: "offline_param" },
    });
    fireEvent.change(screen.getByLabelText(/value/i), {
      target: { value: "offline_value" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^add$/i }));
    
    // Should show offline message - check for "Parameter saved offline"
    expect(await screen.findByText(/Parameter saved offline/i)).toBeInTheDocument();
  });

  it("handles authentication redirect when not authenticated", () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });
    mockUseParameterFetch.mockReturnValue({
      data: [],
      isSuccess: true,
      isLoading: false,
      isError: false,
      error: null,
      refetch: jest.fn(),
    });

    render(<ConfigurationPage />);
    
    // Should show spinner while redirecting
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
    expect(screen.getByText(/Loading configuration/i)).toBeInTheDocument();
  });
});
