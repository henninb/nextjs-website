import { deleteParameter } from "../../hooks/useParameterDelete";
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

jest.mock("../../utils/hookValidation", () => ({
  validateDelete: jest.fn(),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    parameter: jest.fn(() => ["parameter"]),
  },
  removeFromList: jest.fn(),
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
import { validateDelete } from "../../utils/hookValidation";

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
const mockValidateDelete = validateDelete as jest.MockedFunction<
  typeof validateDelete
>;

const createTestParameter = (overrides: Partial<Parameter> = {}): Parameter => ({
  parameterId: 1,
  parameterName: "payment_account",
  parameterValue: "checking_john",
  activeStatus: true,
  ...overrides,
});

describe("useParameterDelete - deleteParameter", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockParseResponse.mockResolvedValue(null);
    mockSanitizeParameterName.mockImplementation((value: string) => value);
    mockValidateDelete.mockImplementation(() => {});
  });

  describe("validation and sanitization", () => {
    it("should call validateDelete with parameterName field", async () => {
      const param = createTestParameter({ parameterName: "payment_account" });

      await deleteParameter(param);

      expect(mockValidateDelete).toHaveBeenCalledWith(
        param,
        "parameterName",
        "deleteParameter",
      );
    });

    it("should sanitize parameterName before building endpoint", async () => {
      const param = createTestParameter({ parameterName: "payment_account" });

      await deleteParameter(param);

      expect(mockSanitizeParameterName).toHaveBeenCalledWith("payment_account");
    });

    it("should use sanitized name in endpoint URL", async () => {
      mockSanitizeParameterName.mockReturnValue("sanitized_param");
      const param = createTestParameter({ parameterName: "raw_param" });

      await deleteParameter(param);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/parameter/sanitized_param");
    });
  });

  describe("successful deletion", () => {
    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      const param = createTestParameter({ parameterName: "payment_account" });

      await deleteParameter(param);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/parameter/payment_account",
        { method: "DELETE" },
      );
    });

    it("should return null when parseResponse returns null (204)", async () => {
      mockParseResponse.mockResolvedValue(null);
      const param = createTestParameter();

      const result = await deleteParameter(param);

      expect(result).toBeNull();
    });

    it("should return parameter data for 200 OK", async () => {
      const param = createTestParameter({ parameterName: "config_key" });
      mockParseResponse.mockResolvedValue(param);

      const result = await deleteParameter(param);

      expect(result).toStrictEqual(param);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const param = createTestParameter();

      await deleteParameter(param);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should delete inactive parameter", async () => {
      const param = createTestParameter({
        parameterName: "old_config",
        activeStatus: false,
      });

      await deleteParameter(param);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/parameter/old_config",
        expect.any(Object),
      );
    });

    it("should delete parameter with empty value", async () => {
      const param = createTestParameter({
        parameterName: "empty_param",
        parameterValue: "",
      });

      await deleteParameter(param);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/parameter/empty_param",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate FetchError from fetchWithErrorHandling", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Parameter not found", 404),
      );
      const param = createTestParameter();

      await expect(deleteParameter(param)).rejects.toThrow(
        "Parameter not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Cannot delete parameter - in use", 409),
      );
      const param = createTestParameter({ parameterName: "payment_account" });

      await expect(deleteParameter(param)).rejects.toThrow(
        "Cannot delete parameter - in use",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const param = createTestParameter();

      await expect(deleteParameter(param)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const param = createTestParameter();

      await expect(deleteParameter(param)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors from validateDelete", async () => {
      mockValidateDelete.mockImplementation(() => {
        const { HookValidationError } = jest.requireMock(
          "../../utils/hookValidation",
        );
        throw new HookValidationError("parameterName is required");
      });
      const param = createTestParameter({ parameterName: "" });

      await expect(deleteParameter(param)).rejects.toThrow(
        "parameterName is required",
      );
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      const param = createTestParameter();

      await deleteParameter(param);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a body in DELETE request", async () => {
      const param = createTestParameter();

      await deleteParameter(param);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("various parameter names", () => {
    it.each(["payment_account", "api_key", "max_retries", "feature_flag"])(
      "should delete parameter '%s'",
      async (name) => {
        const param = createTestParameter({ parameterName: name });

        await deleteParameter(param);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/parameter/${name}`,
          expect.any(Object),
        );
      },
    );
  });
});
