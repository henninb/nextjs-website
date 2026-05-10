import { deleteDescription } from "../../hooks/useDescriptionDelete";
import Description from "../../model/Description";

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
    sanitizeDescription: jest.fn((value: string) => value),
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
    description: jest.fn(() => ["description"]),
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
const mockSanitizeDescription =
  InputSanitizer.sanitizeDescription as jest.MockedFunction<
    typeof InputSanitizer.sanitizeDescription
  >;
const mockValidateDelete = validateDelete as jest.MockedFunction<
  typeof validateDelete
>;

const createTestDescription = (
  overrides: Partial<Description> = {},
): Description => ({
  descriptionId: 1,
  descriptionName: "test_description",
  activeStatus: true,
  ...overrides,
});

describe("useDescriptionDelete - deleteDescription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
    mockParseResponse.mockResolvedValue(null);
    mockSanitizeDescription.mockImplementation((value: string) => value);
    mockValidateDelete.mockImplementation(() => {});
  });

  describe("endpoint and validation", () => {
    it("should call validateDelete with descriptionName field", async () => {
      const desc = createTestDescription({ descriptionName: "amazon" });

      await deleteDescription(desc);

      expect(mockValidateDelete).toHaveBeenCalledWith(
        desc,
        "descriptionName",
        "deleteDescription",
      );
    });

    it("should sanitize descriptionName before building endpoint", async () => {
      const desc = createTestDescription({ descriptionName: "amazon" });

      await deleteDescription(desc);

      expect(mockSanitizeDescription).toHaveBeenCalledWith("amazon");
    });

    it("should call fetchWithErrorHandling with correct DELETE endpoint", async () => {
      const desc = createTestDescription({ descriptionName: "amazon" });

      await deleteDescription(desc);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/description/amazon",
        { method: "DELETE" },
      );
    });

    it("should use sanitized name in endpoint URL", async () => {
      mockSanitizeDescription.mockReturnValue("sanitized_name");
      const desc = createTestDescription({ descriptionName: "raw name" });

      await deleteDescription(desc);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/description/sanitized_name");
    });
  });

  describe("successful deletion", () => {
    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const desc = createTestDescription();

      await deleteDescription(desc);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should return null for 204 No Content", async () => {
      mockParseResponse.mockResolvedValue(null);
      const desc = createTestDescription();

      const result = await deleteDescription(desc);

      expect(result).toBeNull();
    });

    it("should return description data for 200 OK", async () => {
      const desc = createTestDescription({ descriptionName: "walmart" });
      mockParseResponse.mockResolvedValue(desc);

      const result = await deleteDescription(desc);

      expect(result).toStrictEqual(desc);
    });

    it("should handle delete for various description names", async () => {
      const names = ["amazon", "walmart", "target", "grocery_store"];

      for (const name of names) {
        jest.clearAllMocks();
        mockFetchWithErrorHandling.mockResolvedValue({ status: 204 } as Response);
        mockParseResponse.mockResolvedValue(null);
        mockValidateDelete.mockImplementation(() => {});
        mockSanitizeDescription.mockImplementation((v) => v);

        const desc = createTestDescription({ descriptionName: name });
        await deleteDescription(desc);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          `/api/description/${name}`,
          expect.any(Object),
        );
      }
    });

    it("should delete inactive description", async () => {
      const desc = createTestDescription({
        descriptionName: "old_store",
        activeStatus: false,
      });

      await deleteDescription(desc);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/description/old_store",
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should propagate FetchError from fetchWithErrorHandling", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Description not found", 404),
      );
      const desc = createTestDescription();

      await expect(deleteDescription(desc)).rejects.toThrow(
        "Description not found",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Cannot delete description - in use", 409),
      );
      const desc = createTestDescription({ descriptionName: "amazon" });

      await expect(deleteDescription(desc)).rejects.toThrow(
        "Cannot delete description - in use",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const desc = createTestDescription();

      await expect(deleteDescription(desc)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const desc = createTestDescription();

      await expect(deleteDescription(desc)).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors from validateDelete", async () => {
      mockValidateDelete.mockImplementation(() => {
        const { HookValidationError } = jest.requireMock(
          "../../utils/hookValidation",
        );
        throw new HookValidationError("descriptionName is required");
      });
      const desc = createTestDescription({ descriptionName: "" });

      await expect(deleteDescription(desc)).rejects.toThrow(
        "descriptionName is required",
      );
    });
  });

  describe("request format", () => {
    it("should use DELETE method", async () => {
      const desc = createTestDescription();

      await deleteDescription(desc);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("DELETE");
    });

    it("should not send a body in DELETE request", async () => {
      const desc = createTestDescription();

      await deleteDescription(desc);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeUndefined();
    });
  });

  describe("common deletion scenarios", () => {
    it("should delete amazon description", async () => {
      const desc = createTestDescription({ descriptionName: "amazon" });
      mockParseResponse.mockResolvedValue(null);

      const result = await deleteDescription(desc);

      expect(result).toBeNull();
      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/description/amazon",
        expect.any(Object),
      );
    });

    it("should delete gas_station description", async () => {
      const desc = createTestDescription({ descriptionName: "gas_station" });
      mockParseResponse.mockResolvedValue(null);

      await deleteDescription(desc);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/description/gas_station",
        expect.any(Object),
      );
    });
  });
});
