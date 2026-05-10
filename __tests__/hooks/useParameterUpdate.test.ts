import React from "react";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { updateParameter } from "../../hooks/useParameterUpdate";
import useParameterUpdate from "../../hooks/useParameterUpdate";
import Parameter from "../../model/Parameter";

jest.mock("../../utils/fetchUtils", () => ({
  fetchWithErrorHandling: jest.fn(),
  parseResponse: jest.fn(),
  FetchError: class FetchError extends Error {
    constructor(
      message: string,
      public status?: number,
    ) {
      super(message);
      this.name = "FetchError";
    }
  },
}));

jest.mock("../../utils/validation/sanitization", () => ({
  InputSanitizer: {
    sanitizeParameterName: jest.fn((value: string) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    parameter: jest.fn(() => ["parameter"]),
  },
  updateInList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { InputSanitizer } from "../../utils/validation/sanitization";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockSanitizeParameterName =
  InputSanitizer.sanitizeParameterName as jest.MockedFunction<
    typeof InputSanitizer.sanitizeParameterName
  >;

const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
  parameterId: 1,
  parameterName: "payment_account",
  parameterValue: "checking_john",
  activeStatus: true,
  ...overrides,
});

describe("useParameterUpdate - updateParameter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeParameterName.mockImplementation((value: string) => value);
  });

  describe("endpoint construction", () => {
    it("should use old parameter name in PUT endpoint URL", async () => {
      const oldParam = createTestParameter({ parameterName: "old_param" });
      const newParam = createTestParameter({ parameterName: "new_param" });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/parameter/old_param");
    });

    it("should sanitize old parameter name for URL", async () => {
      const oldParam = createTestParameter({ parameterName: "payment_account" });
      const newParam = createTestParameter({ parameterName: "checking" });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      expect(mockSanitizeParameterName).toHaveBeenCalledWith("payment_account");
    });

    it("should sanitize new parameter name for body", async () => {
      const oldParam = createTestParameter({ parameterName: "old" });
      const newParam = createTestParameter({ parameterName: "new_name" });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      expect(mockSanitizeParameterName).toHaveBeenCalledWith("new_name");
    });

    it("should use sanitized old name in endpoint", async () => {
      mockSanitizeParameterName
        .mockReturnValueOnce("sanitized_old")
        .mockReturnValueOnce("sanitized_new");
      const oldParam = createTestParameter({ parameterName: "old" });
      const newParam = createTestParameter({ parameterName: "new" });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/parameter/sanitized_old");
    });
  });

  describe("successful update", () => {
    it("should return the updated parameter", async () => {
      const oldParam = createTestParameter();
      const newParam = createTestParameter({
        parameterName: "updated_param",
        parameterValue: "new_value",
      });
      mockParseResponse.mockResolvedValue(newParam);

      const result = await updateParameter(oldParam, newParam);

      expect(result).toStrictEqual(newParam);
    });

    it("should send sanitized new parameter as JSON body", async () => {
      mockSanitizeParameterName
        .mockReturnValueOnce("old_sanitized")
        .mockReturnValueOnce("new_sanitized");
      const oldParam = createTestParameter({ parameterName: "old" });
      const newParam = createTestParameter({
        parameterName: "new",
        parameterValue: "val",
      });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.parameterName).toBe("new_sanitized");
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const oldParam = createTestParameter();
      const newParam = createTestParameter({ parameterName: "updated" });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should update parameter value", async () => {
      const oldParam = createTestParameter({ parameterValue: "checking_old" });
      const newParam = createTestParameter({ parameterValue: "checking_new" });
      mockParseResponse.mockResolvedValue(newParam);

      const result = await updateParameter(oldParam, newParam);

      expect(result.parameterValue).toBe("checking_new");
    });

    it("should update boolean string value", async () => {
      const oldParam = createTestParameter({
        parameterName: "enable_feature",
        parameterValue: "false",
      });
      const newParam = createTestParameter({
        parameterName: "enable_feature",
        parameterValue: "true",
      });
      mockParseResponse.mockResolvedValue(newParam);

      const result = await updateParameter(oldParam, newParam);

      expect(result.parameterValue).toBe("true");
    });

    it("should handle update with same name but different value", async () => {
      const oldParam = createTestParameter({
        parameterName: "max_retries",
        parameterValue: "3",
      });
      const newParam = createTestParameter({
        parameterName: "max_retries",
        parameterValue: "5",
      });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/parameter/max_retries",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Parameter not found", 404),
      );
      const oldParam = createTestParameter();
      const newParam = createTestParameter({ parameterName: "updated" });

      await expect(updateParameter(oldParam, newParam)).rejects.toThrow(
        "Parameter not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Parameter name already exists", 409),
      );
      const oldParam = createTestParameter();
      const newParam = createTestParameter({ parameterName: "existing" });

      await expect(updateParameter(oldParam, newParam)).rejects.toThrow(
        "Parameter name already exists",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const oldParam = createTestParameter();
      const newParam = createTestParameter({ parameterName: "updated" });

      await expect(updateParameter(oldParam, newParam)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const oldParam = createTestParameter();
      const newParam = createTestParameter({ parameterName: "updated" });

      await expect(updateParameter(oldParam, newParam)).rejects.toThrow(
        "Internal server error",
      );
    });
  });

  describe("request format", () => {
    it("should use PUT method", async () => {
      const oldParam = createTestParameter();
      const newParam = createTestParameter({ parameterName: "updated" });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("PUT");
    });

    it("should include new parameter data as JSON in body", async () => {
      const oldParam = createTestParameter();
      const newParam = createTestParameter({
        parameterName: "new_name",
        parameterValue: "new_value",
      });
      mockParseResponse.mockResolvedValue(newParam);

      await updateParameter(oldParam, newParam);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
    });
  });
});

// ---------------------------------------------------------------------------
// renderHook tests for useParameterUpdate default export
// ---------------------------------------------------------------------------

const createHookQueryClient = () =>
  new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

const createHookWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(QueryClientProvider, { client: queryClient }, children);
  };

describe("useParameterUpdate hook - renderHook tests", () => {
  const mockUpdateInList = jest.requireMock("../../utils/cacheUtils").updateInList as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeParameterName.mockImplementation((value: string) => value);
  });

  it("onSuccess calls updateInList with the updated parameter", async () => {
    const queryClient = createHookQueryClient();
    const updatedParam = createTestParameter({ parameterName: "new_name", parameterValue: "new_value" });
    mockParseResponse.mockResolvedValue(updatedParam);

    const { result } = renderHook(() => useParameterUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      await result.current.mutateAsync({
        oldParameter: createTestParameter(),
        newParameter: updatedParam,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockUpdateInList).toHaveBeenCalledWith(
      expect.anything(),
      ["parameter"],
      updatedParam,
      "parameterId",
    );
  });

  it("onError puts mutation into error state", async () => {
    const queryClient = createHookQueryClient();
    const { FetchError } = jest.requireMock("../../utils/fetchUtils");
    mockFetchWithErrorHandling.mockRejectedValue(new FetchError("Update failed", 404));

    const { result } = renderHook(() => useParameterUpdate(), {
      wrapper: createHookWrapper(queryClient),
    });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          oldParameter: createTestParameter(),
          newParameter: createTestParameter({ parameterName: "new" }),
        });
      } catch {
        // expected
      }
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
