import {
  FetchError,
  handleFetchError,
  fetchWithErrorHandling,
  parseResponse,
  fetchWithTimeout,
  createQueryFn,
  createMutationFn,
  isFetchError,
  getErrorMessage,
  DEFAULT_FETCH_OPTIONS,
} from "../../utils/fetchUtils";

// Mock global fetch
global.fetch = jest.fn();

describe("fetchUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("FetchError", () => {
    it("should create error with all properties", () => {
      const error = new FetchError("Test error", 404, "Not Found", {
        message: "Resource not found",
      });

      expect(error.message).toBe("Test error");
      expect(error.status).toBe(404);
      expect(error.statusText).toBe("Not Found");
      expect(error.body).toEqual({ message: "Resource not found" });
      expect(error.name).toBe("FetchError");
    });

    it("should identify client errors (4xx)", () => {
      const error400 = new FetchError("Bad Request", 400);
      const error404 = new FetchError("Not Found", 404);
      const error499 = new FetchError("Client Error", 499);

      expect(error400.isClientError).toBe(true);
      expect(error404.isClientError).toBe(true);
      expect(error499.isClientError).toBe(true);

      expect(error400.isServerError).toBe(false);
      expect(error400.isNetworkError).toBe(false);
      expect(error400.isAuthError).toBe(false);
    });

    it("should identify server errors (5xx)", () => {
      const error500 = new FetchError("Internal Server Error", 500);
      const error503 = new FetchError("Service Unavailable", 503);

      expect(error500.isServerError).toBe(true);
      expect(error503.isServerError).toBe(true);

      expect(error500.isClientError).toBe(false);
      expect(error500.isNetworkError).toBe(false);
      expect(error500.isAuthError).toBe(false);
    });

    it("should identify authentication errors (401, 403)", () => {
      const error401 = new FetchError("Unauthorized", 401);
      const error403 = new FetchError("Forbidden", 403);

      expect(error401.isAuthError).toBe(true);
      expect(error403.isAuthError).toBe(true);

      expect(error401.isClientError).toBe(true); // Auth errors are also client errors
      expect(error401.isServerError).toBe(false);
      expect(error401.isNetworkError).toBe(false);
    });

    it("should identify network errors (no status)", () => {
      const error = new FetchError("Network request failed");

      expect(error.isNetworkError).toBe(true);
      expect(error.isClientError).toBe(false);
      expect(error.isServerError).toBe(false);
      expect(error.isAuthError).toBe(false);
    });
  });

  describe("handleFetchError", () => {
    it("should extract error message from JSON body with response field", async () => {
      const mockResponse = {
        status: 400,
        statusText: "Bad Request",
        ok: false,
        json: jest.fn().mockResolvedValue({
          response: "Custom error message",
        }),
      } as unknown as Response;

      await expect(handleFetchError(mockResponse)).rejects.toThrow(
        "Custom error message",
      );
    });

    it("should extract error message from JSON body with message field", async () => {
      const mockResponse = {
        status: 400,
        statusText: "Bad Request",
        ok: false,
        json: jest.fn().mockResolvedValue({
          message: "Validation failed",
        }),
      } as unknown as Response;

      await expect(handleFetchError(mockResponse)).rejects.toThrow(
        "Validation failed",
      );
    });

    it("should extract error message from JSON body with error field", async () => {
      const mockResponse = {
        status: 500,
        statusText: "Internal Server Error",
        ok: false,
        json: jest.fn().mockResolvedValue({
          error: "Database connection failed",
        }),
      } as unknown as Response;

      await expect(handleFetchError(mockResponse)).rejects.toThrow(
        "Database connection failed",
      );
    });

    it("should use default message when JSON parsing fails", async () => {
      const mockResponse = {
        status: 404,
        statusText: "Not Found",
        ok: false,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as Response;

      await expect(handleFetchError(mockResponse)).rejects.toThrow(
        "HTTP 404: Not Found",
      );
    });

    it("should throw FetchError instance", async () => {
      const mockResponse = {
        status: 500,
        statusText: "Internal Server Error",
        ok: false,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      try {
        await handleFetchError(mockResponse);
        fail("Should have thrown");
      } catch (error) {
        expect(error).toBeInstanceOf(FetchError);
        expect((error as FetchError).status).toBe(500);
      }
    });
  });

  describe("fetchWithErrorHandling", () => {
    it("should fetch successfully and return response", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({ data: "test" }),
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const response = await fetchWithErrorHandling("/api/test");

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
      expect(response).toBe(mockResponse);
    });

    it("should merge custom headers with defaults", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await fetchWithErrorHandling("/api/test", {
        headers: {
          Authorization: "Bearer token",
        },
      });

      expect(global.fetch).toHaveBeenCalledWith("/api/test", {
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer token",
        },
      });
    });

    it("should throw FetchError on HTTP error", async () => {
      const mockResponse = {
        ok: false,
        status: 404,
        statusText: "Not Found",
        json: jest.fn().mockResolvedValue({ response: "Resource not found" }),
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(fetchWithErrorHandling("/api/test")).rejects.toThrow(
        FetchError,
      );
      await expect(fetchWithErrorHandling("/api/test")).rejects.toThrow(
        "Resource not found",
      );
    });

    it("should throw FetchError on network error", async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new Error("Network request failed"),
      );

      await expect(fetchWithErrorHandling("/api/test")).rejects.toThrow(
        FetchError,
      );
      await expect(fetchWithErrorHandling("/api/test")).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should re-throw FetchError as-is", async () => {
      const fetchError = new FetchError("Custom error", 400);
      (global.fetch as jest.Mock).mockRejectedValue(fetchError);

      await expect(fetchWithErrorHandling("/api/test")).rejects.toThrow(
        fetchError,
      );
    });
  });

  describe("parseResponse", () => {
    it("should parse JSON response", async () => {
      const mockData = { id: 1, name: "test" };
      const mockResponse = {
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      } as unknown as Response;

      const result = await parseResponse(mockResponse);

      expect(result).toEqual(mockData);
      expect(mockResponse.json).toHaveBeenCalled();
    });

    it("should return null for 204 No Content", async () => {
      const mockResponse = {
        status: 204,
        json: jest.fn(),
      } as unknown as Response;

      const result = await parseResponse(mockResponse);

      expect(result).toBeNull();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should throw FetchError on JSON parse failure", async () => {
      const mockResponse = {
        status: 200,
        json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as Response;

      await expect(parseResponse(mockResponse)).rejects.toThrow(FetchError);
      await expect(parseResponse(mockResponse)).rejects.toThrow(
        "Response parsing failed",
      );
    });
  });

  describe("fetchWithTimeout", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it("should fetch successfully before timeout", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const promise = fetchWithTimeout("/api/test", { timeout: 5000 });

      // Fast-forward time but not past timeout
      jest.advanceTimersByTime(1000);

      const response = await promise;

      expect(response).toBe(mockResponse);
    });

    it("should timeout if request takes too long", async () => {
      jest.useRealTimers();

      (global.fetch as jest.Mock).mockImplementation((_url, options) => {
        return new Promise((_resolve, reject) => {
          options?.signal?.addEventListener("abort", () => {
            const abortError = new Error("Aborted");
            abortError.name = "AbortError";
            reject(abortError);
          });
        });
      });

      await expect(
        fetchWithTimeout("/api/test", { timeout: 5 }),
      ).rejects.toThrow("Request timeout");

      (global.fetch as jest.Mock).mockReset();
      jest.useFakeTimers();
    });

    it("should use default timeout of 30 seconds", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const promise = fetchWithTimeout("/api/test");

      jest.advanceTimersByTime(29000); // Just before 30s

      const response = await promise;

      expect(response).toBe(mockResponse);
    });
  });

  describe("createQueryFn", () => {
    it("should create query function that fetches and parses", async () => {
      const mockData = { id: 1, name: "test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const queryFn = createQueryFn<typeof mockData>("/api/test");
      const result = await queryFn({ signal: new AbortController().signal });

      expect(result).toEqual(mockData);
    });

    it("should pass signal to fetch", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const signal = new AbortController().signal;
      const queryFn = createQueryFn("/api/test");
      await queryFn({ signal });

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({ signal }),
      );
    });

    it("should work with custom options", async () => {
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue({}),
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const queryFn = createQueryFn("/api/test", { method: "POST" });
      await queryFn({});

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  describe("createMutationFn", () => {
    it("should create mutation function with correct method", async () => {
      const mockData = { id: 1, name: "test" };
      const mockResponse = {
        ok: true,
        status: 200,
        json: jest.fn().mockResolvedValue(mockData),
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mutationFn = createMutationFn<typeof mockData, { name: string }>(
        "/api/test",
        "POST",
      );
      const result = await mutationFn({ name: "test" });

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ name: "test" }),
        }),
      );
    });

    it("should not stringify body for DELETE", async () => {
      const mockResponse = {
        ok: true,
        status: 204,
      } as unknown as Response;

      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const mutationFn = createMutationFn("/api/test/123", "DELETE");
      await mutationFn(undefined);

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/test/123",
        expect.objectContaining({
          method: "DELETE",
        }),
      );

      const callArgs = (global.fetch as jest.Mock).mock.calls[0][1];
      expect(callArgs.body).toBeUndefined();
    });
  });

  describe("isFetchError", () => {
    it("should return true for FetchError instances", () => {
      const error = new FetchError("Test error", 404);
      expect(isFetchError(error)).toBe(true);
    });

    it("should return false for regular errors", () => {
      const error = new Error("Regular error");
      expect(isFetchError(error)).toBe(false);
    });

    it("should return false for non-error values", () => {
      expect(isFetchError(null)).toBe(false);
      expect(isFetchError(undefined)).toBe(false);
      expect(isFetchError("string")).toBe(false);
      expect(isFetchError({})).toBe(false);
    });
  });

  describe("getErrorMessage", () => {
    it("should extract message from Error", () => {
      const error = new Error("Error message");
      expect(getErrorMessage(error)).toBe("Error message");
    });

    it("should extract message from FetchError", () => {
      const error = new FetchError("Fetch failed", 500);
      // getUserMessage() returns friendly message for server errors
      expect(getErrorMessage(error)).toBe("Server error. Please try again later.");
    });

    it("should return string as-is", () => {
      expect(getErrorMessage("String error")).toBe("String error");
    });

    it("should extract message from object with message property", () => {
      const error = { message: "Object error" };
      expect(getErrorMessage(error)).toBe("Object error");
    });

    it("should return default message for unknown errors", () => {
      expect(getErrorMessage(null)).toBe("An unknown error occurred");
      expect(getErrorMessage(undefined)).toBe("An unknown error occurred");
      expect(getErrorMessage(123)).toBe("An unknown error occurred");
    });
  });

  describe("DEFAULT_FETCH_OPTIONS", () => {
    it("should have correct default values", () => {
      expect(DEFAULT_FETCH_OPTIONS).toEqual({
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      });
    });
  });
});
