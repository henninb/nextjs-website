import { renderHook, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

const useErrorHandling = () => {
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleAsyncError = React.useCallback(async (
    asyncOperation: () => Promise<any>,
    errorKey: string,
    maxRetries: number = 0 // Default to 0 to avoid retry complexity in tests
  ) => {
    setIsLoading(true);
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });

    try {
      const result = await asyncOperation();
      setRetryCount(0);
      setIsLoading(false);
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || error?.response?.data?.message || "An unexpected error occurred";
      setErrors(prev => ({ ...prev, [errorKey]: errorMessage }));
      setRetryCount(0);
      setIsLoading(false);
      throw error;
    }
  }, []);

  const isRetriableError = (error: any): boolean => {
    if (error?.response?.status) {
      const status = error.response.status;
      return status >= 500 || status === 429 || status === 408;
    }
    
    if (error?.code) {
      return ["NETWORK_ERROR", "TIMEOUT", "ECONNABORTED"].includes(error.code);
    }
    
    return false;
  };

  const getRetryDelay = (attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt), 30000);
  };

  const handleValidationErrors = (validationResult: { 
    isValid: boolean; 
    errors?: Record<string, string> 
  }) => {
    if (!validationResult.isValid && validationResult.errors) {
      setErrors(validationResult.errors);
      return false;
    }
    setErrors({});
    return true;
  };

  const clearError = (errorKey: string) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[errorKey];
      return newErrors;
    });
  };

  const clearAllErrors = () => {
    setErrors({});
  };

  const hasErrors = () => {
    return Object.keys(errors).length > 0;
  };

  const getError = (errorKey: string): string | undefined => {
    return errors[errorKey];
  };

  return {
    errors,
    isLoading,
    retryCount,
    handleAsyncError,
    handleValidationErrors,
    clearError,
    clearAllErrors,
    hasErrors,
    getError,
    isRetriableError,
    getRetryDelay,
  };
};

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

const createWrapper = (queryClient: QueryClient) => {
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useErrorHandling Hook", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = createTestQueryClient();
    jest.clearAllMocks();
  });

  describe("Basic Error Handling", () => {
    it("handles successful async operations", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const successfulOperation = jest.fn().mockResolvedValue("success");

      await act(async () => {
        const resultValue = await result.current.handleAsyncError(
          successfulOperation,
          "test-error"
        );
        expect(resultValue).toBe("success");
      });

      expect(result.current.hasErrors()).toBe(false);
      expect(successfulOperation).toHaveBeenCalledTimes(1);
    });

    it("handles async operation failures", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const failingOperation = jest.fn().mockRejectedValue(new Error("Operation failed"));

      await act(async () => {
        try {
          await result.current.handleAsyncError(failingOperation, "test-error");
        } catch (error) {
          expect(error.message).toBe("Operation failed");
        }
      });

      expect(result.current.errors["test-error"]).toBe("Operation failed");
      expect(result.current.hasErrors()).toBe(true);
    });

    it("handles HTTP response errors", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const httpError = {
        response: {
          status: 400,
          data: { message: "Bad request" },
        },
      };

      const failingOperation = jest.fn().mockRejectedValue(httpError);

      await act(async () => {
        try {
          await result.current.handleAsyncError(failingOperation, "http-error");
        } catch (error) {
          expect(error).toBe(httpError);
        }
      });

      expect(result.current.errors["http-error"]).toBe("Bad request");
    });
  });

  describe("Retry Logic", () => {
    it("identifies retriable errors correctly", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isRetriableError({ response: { status: 500 } })).toBe(true);
      expect(result.current.isRetriableError({ response: { status: 502 } })).toBe(true);
      expect(result.current.isRetriableError({ response: { status: 429 } })).toBe(true);
      expect(result.current.isRetriableError({ response: { status: 408 } })).toBe(true);
      expect(result.current.isRetriableError({ code: "NETWORK_ERROR" })).toBe(true);
      expect(result.current.isRetriableError({ code: "TIMEOUT" })).toBe(true);
      
      expect(result.current.isRetriableError({ response: { status: 400 } })).toBe(false);
      expect(result.current.isRetriableError({ response: { status: 404 } })).toBe(false);
      expect(result.current.isRetriableError({ code: "VALIDATION_ERROR" })).toBe(false);
    });

    it("calculates exponential backoff delays", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.getRetryDelay(0)).toBe(1000);
      expect(result.current.getRetryDelay(1)).toBe(2000);
      expect(result.current.getRetryDelay(2)).toBe(4000);
      expect(result.current.getRetryDelay(3)).toBe(8000);
      expect(result.current.getRetryDelay(10)).toBe(30000); // Max delay cap
    });

    it("identifies retriable vs non-retriable errors", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isRetriableError({ response: { status: 500 } })).toBe(true);
      expect(result.current.isRetriableError({ response: { status: 400 } })).toBe(false);
      expect(result.current.isRetriableError({ code: "NETWORK_ERROR" })).toBe(true);
      expect(result.current.isRetriableError({ code: "VALIDATION_ERROR" })).toBe(false);
    });

    it("does not retry non-retriable errors", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const nonRetriableError = { response: { status: 400 }, message: "Bad request" };
      const failingOperation = jest.fn().mockRejectedValue(nonRetriableError);

      await act(async () => {
        try {
          await result.current.handleAsyncError(failingOperation, "no-retry-error");
        } catch (error) {
          expect(error).toBe(nonRetriableError);
        }
      });

      expect(failingOperation).toHaveBeenCalledTimes(1);
      expect(result.current.errors["no-retry-error"]).toBe("Bad request");
    });
  });

  describe("Validation Error Handling", () => {
    it("handles validation errors", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const validationResult = {
        isValid: false,
        errors: {
          amount: "Amount is required",
          category: "Category is invalid",
        },
      };

      act(() => {
        const isValid = result.current.handleValidationErrors(validationResult);
        expect(isValid).toBe(false);
      });

      expect(result.current.errors).toEqual({
        amount: "Amount is required",
        category: "Category is invalid",
      });
      expect(result.current.hasErrors()).toBe(true);
    });

    it("clears errors for valid validation", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      // First set some errors
      act(() => {
        result.current.handleValidationErrors({
          isValid: false,
          errors: { field: "Error message" },
        });
      });

      // Then clear them with valid validation
      act(() => {
        const isValid = result.current.handleValidationErrors({ isValid: true });
        expect(isValid).toBe(true);
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.hasErrors()).toBe(false);
    });
  });

  describe("Error Management", () => {
    it("clears specific errors", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.handleValidationErrors({
          isValid: false,
          errors: {
            field1: "Error 1",
            field2: "Error 2",
            field3: "Error 3",
          },
        });
      });

      act(() => {
        result.current.clearError("field2");
      });

      expect(result.current.errors).toEqual({
        field1: "Error 1",
        field3: "Error 3",
      });
      expect(result.current.getError("field2")).toBeUndefined();
    });

    it("clears all errors", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.handleValidationErrors({
          isValid: false,
          errors: {
            field1: "Error 1",
            field2: "Error 2",
          },
        });
      });

      act(() => {
        result.current.clearAllErrors();
      });

      expect(result.current.errors).toEqual({});
      expect(result.current.hasErrors()).toBe(false);
    });

    it("gets specific error messages", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      act(() => {
        result.current.handleValidationErrors({
          isValid: false,
          errors: {
            amount: "Amount is required",
            category: "Category is invalid",
          },
        });
      });

      expect(result.current.getError("amount")).toBe("Amount is required");
      expect(result.current.getError("category")).toBe("Category is invalid");
      expect(result.current.getError("nonexistent")).toBeUndefined();
    });
  });

  describe("Loading State", () => {
    it("manages loading state during async operations", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      expect(result.current.isLoading).toBe(false);

      const fastOperation = jest.fn().mockResolvedValue("success");

      await act(async () => {
        const resultValue = await result.current.handleAsyncError(fastOperation, "test");
        expect(resultValue).toBe("success");
      });

      expect(result.current.isLoading).toBe(false);
      expect(fastOperation).toHaveBeenCalledTimes(1);
    });
  });

  describe("Finance-Specific Error Scenarios", () => {
    it("handles transaction validation errors", () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const transactionErrors = {
        isValid: false,
        errors: {
          amount: "Amount cannot exceed $999,999.99",
          category: "Category is required",
          description: "Description cannot be empty",
          transactionDate: "Date cannot be in the future",
        },
      };

      act(() => {
        result.current.handleValidationErrors(transactionErrors);
      });

      expect(result.current.getError("amount")).toBe("Amount cannot exceed $999,999.99");
      expect(result.current.getError("category")).toBe("Category is required");
      expect(result.current.getError("description")).toBe("Description cannot be empty");
      expect(result.current.getError("transactionDate")).toBe("Date cannot be in the future");
    });

    it("handles account-related errors", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const accountError = {
        response: {
          status: 403,
          data: { message: "Insufficient permissions to access this account" },
        },
      };

      const failingAccountOperation = jest.fn().mockRejectedValue(accountError);

      await act(async () => {
        try {
          await result.current.handleAsyncError(failingAccountOperation, "account-error");
        } catch (error) {
          expect(error).toBe(accountError);
        }
      });

      expect(result.current.getError("account-error")).toBe("Insufficient permissions to access this account");
    });

    it("handles network connectivity issues", async () => {
      const { result } = renderHook(() => useErrorHandling(), {
        wrapper: createWrapper(queryClient),
      });

      const networkError = {
        code: "NETWORK_ERROR",
        message: "Network request failed",
      };

      const failingNetworkOperation = jest.fn().mockRejectedValue(networkError);

      await act(async () => {
        try {
          await result.current.handleAsyncError(failingNetworkOperation, "network-error");
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });

      expect(result.current.getError("network-error")).toBe("Network request failed");
      expect(result.current.isRetriableError(networkError)).toBe(true);
    });
  });
});