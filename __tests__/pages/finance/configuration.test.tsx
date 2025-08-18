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

// Mock auth
jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

// Mock hooks used by the page
jest.mock("../../../hooks/useParameterFetch", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("../../../hooks/useParameterInsert", () => ({
  __esModule: true,
  default: () => ({ mutateAsync: jest.fn().mockResolvedValue({}) }),
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

describe("pages/finance/configuration", () => {
  const mockUseAuth = useAuthMock as unknown as jest.Mock;
  const mockUseParameterFetch = useParameterFetchMock as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
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
        { parameterId: "p1", parameterName: "payment_account", parameterValue: "Chase" },
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
});
