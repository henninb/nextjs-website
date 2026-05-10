import React from "react";
import { renderHook, act, waitFor } from "@testing-library/react";

const mockRouterReplace = jest.fn();
const mockRouterPush = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockRouterReplace, push: mockRouterPush }),
}));

const mockUseAuth = jest.fn();
jest.mock("../../components/AuthProvider", () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock("../../types", () => ({
  getErrorMessage: jest.fn((error: unknown) => {
    if (error instanceof Error) return error.message;
    if (typeof error === "string") return error;
    return "";
  }),
}));

import { useFinancePageState } from "../../hooks/useFinancePageState";

describe("useFinancePageState", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });
    localStorage.clear();
  });

  describe("initial state", () => {
    it("returns correct default values", () => {
      const { result } = renderHook(() => useFinancePageState());

      expect(result.current.message).toBe("");
      expect(result.current.showSnackbar).toBe(false);
      expect(result.current.snackbarSeverity).toBe("info");
      expect(result.current.showSpinner).toBe(true);
      expect(result.current.showModalAdd).toBe(false);
      expect(result.current.showModalDelete).toBe(false);
      expect(result.current.paginationModel).toEqual({ pageSize: 50, page: 0 });
      expect(result.current.cacheEnabled).toBe(false);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.loading).toBe(false);
    });

    it("returns false for cacheEnabled when no key provided", () => {
      const { result } = renderHook(() => useFinancePageState());
      expect(result.current.cacheEnabled).toBe(false);
    });

    it("reads cacheEnabled from localStorage when cacheEnabledKey is provided", () => {
      localStorage.setItem("myFeatureKey", "true");
      const { result } = renderHook(() => useFinancePageState("myFeatureKey"));
      expect(result.current.cacheEnabled).toBe(true);
    });

    it("returns false for cacheEnabled when localStorage value is not 'true'", () => {
      localStorage.setItem("myFeatureKey", "false");
      const { result } = renderHook(() => useFinancePageState("myFeatureKey"));
      expect(result.current.cacheEnabled).toBe(false);
    });
  });

  describe("authentication redirect", () => {
    it("redirects to /login when not authenticated and not loading", async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: false });

      renderHook(() => useFinancePageState());

      await waitFor(() => expect(mockRouterReplace).toHaveBeenCalledWith("/login"));
    });

    it("does not redirect when still loading", async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });

      renderHook(() => useFinancePageState());

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });

    it("does not redirect when authenticated", async () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: true, loading: false });

      renderHook(() => useFinancePageState());

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockRouterReplace).not.toHaveBeenCalled();
    });
  });

  describe("handleSnackbarClose", () => {
    it("sets showSnackbar to false", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setShowSnackbar(true);
      });
      expect(result.current.showSnackbar).toBe(true);

      act(() => {
        result.current.handleSnackbarClose();
      });
      expect(result.current.showSnackbar).toBe(false);
    });
  });

  describe("handleError", () => {
    it("sets error message with module name prefix", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.handleError(new Error("Something went wrong"), "TestModule", false);
      });

      expect(result.current.message).toBe("TestModule: Something went wrong");
      expect(result.current.snackbarSeverity).toBe("error");
      expect(result.current.showSnackbar).toBe(true);
    });

    it("uses Failure fallback when error has no message", () => {
      const { getErrorMessage } = jest.requireMock("../../types");
      (getErrorMessage as jest.Mock).mockReturnValueOnce("");

      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.handleError(new Error(), "MyModule", false);
      });

      expect(result.current.message).toBe("MyModule: Failure");
    });

    it("throws the error when throwIt is true", () => {
      const { result } = renderHook(() => useFinancePageState());
      const err = new Error("Fatal error");

      expect(() => {
        act(() => {
          result.current.handleError(err, "TestModule", true);
        });
      }).toThrow("Fatal error");
    });
  });

  describe("handleSuccess", () => {
    it("sets success message and severity", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.handleSuccess("Operation completed successfully");
      });

      expect(result.current.message).toBe("Operation completed successfully");
      expect(result.current.snackbarSeverity).toBe("success");
      expect(result.current.showSnackbar).toBe(true);
    });
  });

  describe("state setters", () => {
    it("setMessage updates message", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setMessage("New message");
      });

      expect(result.current.message).toBe("New message");
    });

    it("setShowSpinner toggles spinner", () => {
      const { result } = renderHook(() => useFinancePageState());
      expect(result.current.showSpinner).toBe(true);

      act(() => {
        result.current.setShowSpinner(false);
      });

      expect(result.current.showSpinner).toBe(false);
    });

    it("setShowModalAdd toggles modal", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setShowModalAdd(true);
      });

      expect(result.current.showModalAdd).toBe(true);
    });

    it("setShowModalDelete toggles delete modal", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setShowModalDelete(true);
      });

      expect(result.current.showModalDelete).toBe(true);
    });

    it("setPaginationModel updates pagination", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setPaginationModel({ pageSize: 25, page: 2 });
      });

      expect(result.current.paginationModel).toEqual({ pageSize: 25, page: 2 });
    });

    it("setCacheEnabled updates cacheEnabled", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setCacheEnabled(true);
      });

      expect(result.current.cacheEnabled).toBe(true);
    });

    it("setSnackbarSeverity updates severity", () => {
      const { result } = renderHook(() => useFinancePageState());

      act(() => {
        result.current.setSnackbarSeverity("warning");
      });

      expect(result.current.snackbarSeverity).toBe("warning");
    });
  });

  describe("auth state passthrough", () => {
    it("reflects current auth state from useAuth", () => {
      mockUseAuth.mockReturnValue({ isAuthenticated: false, loading: true });

      const { result } = renderHook(() => useFinancePageState());

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.loading).toBe(true);
    });
  });
});
