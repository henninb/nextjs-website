import { insertDescription } from "../../hooks/useDescriptionInsert";
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

jest.mock("../../utils/hookValidation", () => ({
  validateInsert: jest.fn((data: unknown) => data),
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

jest.mock("../../utils/validation", () => ({
  DataValidator: {
    validateDescription: jest.fn((data: unknown) => data),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    description: jest.fn(() => ["description"]),
  },
  addToList: jest.fn(),
}));

jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  })),
}));

jest.mock("../../components/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    isAuthenticated: true,
    loading: false,
    user: { username: "john" },
    login: jest.fn(),
    logout: jest.fn(),
  })),
}));

import { fetchWithErrorHandling, parseResponse } from "../../utils/fetchUtils";
import { validateInsert } from "../../utils/hookValidation";

const mockFetchWithErrorHandling = fetchWithErrorHandling as jest.MockedFunction<
  typeof fetchWithErrorHandling
>;
const mockParseResponse = parseResponse as jest.MockedFunction<
  typeof parseResponse
>;
const mockValidateInsert = validateInsert as jest.MockedFunction<
  typeof validateInsert
>;

const createTestDescription = (
  overrides: Partial<Description> = {},
): Description => ({
  descriptionId: 1,
  descriptionName: "groceries",
  activeStatus: true,
  ...overrides,
});

describe("useDescriptionInsert - insertDescription", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 201 } as Response);
    mockValidateInsert.mockImplementation((data: unknown) => data as Description);
  });

  describe("validation", () => {
    it("should call validateInsert with description data", async () => {
      const desc = createTestDescription({ descriptionName: "amazon" });
      mockParseResponse.mockResolvedValue(desc);

      await insertDescription("amazon");

      expect(mockValidateInsert).toHaveBeenCalledWith(
        expect.objectContaining({ descriptionName: "amazon" }),
        expect.any(Function),
        "insertDescription",
      );
    });

    it("should use validated data in request body", async () => {
      const validatedData = { descriptionName: "validated_amazon", activeStatus: true, owner: "" };
      mockValidateInsert.mockReturnValue(validatedData);
      mockParseResponse.mockResolvedValue(createTestDescription({ descriptionName: "validated_amazon" }));

      await insertDescription("amazon");

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.descriptionName).toBe("validated_amazon");
    });
  });

  describe("successful insertion", () => {
    it("should POST to /api/description", async () => {
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("amazon");

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/description");
    });

    it("should use POST method", async () => {
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("amazon");

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("POST");
    });

    it("should return the created description", async () => {
      const desc = createTestDescription({ descriptionId: 5, descriptionName: "target" });
      mockParseResponse.mockResolvedValue(desc);

      const result = await insertDescription("target");

      expect(result).toStrictEqual(desc);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 201 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("amazon");

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should include description data in request body", async () => {
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("grocery_store");

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
      const body = JSON.parse(options?.body as string);
      expect(body.descriptionName).toBe("grocery_store");
      expect(body.activeStatus).toBe(true);
    });

    it("should pass owner parameter to description data", async () => {
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("amazon", "test_user");

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.owner).toBe("test_user");
    });

    it.each(["groceries", "dining", "entertainment", "utilities", "healthcare"])(
      "should insert '%s' description",
      async (name) => {
        mockParseResponse.mockResolvedValue(createTestDescription({ descriptionName: name }));

        const result = await insertDescription(name);

        expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
          "/api/description",
          expect.objectContaining({ method: "POST" }),
        );
        expect(result?.descriptionName).toBe(name);
      },
    );
  });

  describe("error handling", () => {
    it("should propagate 400 bad request error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Invalid description data", 400),
      );

      await expect(insertDescription("amazon")).rejects.toThrow(
        "Invalid description data",
      );
    });

    it("should propagate 409 conflict error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Description already exists", 409),
      );

      await expect(insertDescription("amazon")).rejects.toThrow(
        "Description already exists",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );

      await expect(insertDescription("amazon")).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );

      await expect(insertDescription("amazon")).rejects.toThrow(
        "Network request failed",
      );
    });

    it("should propagate validation errors", async () => {
      const { HookValidationError } = jest.requireMock(
        "../../utils/hookValidation",
      );
      mockValidateInsert.mockImplementation(() => {
        throw new HookValidationError("descriptionName is required");
      });

      await expect(insertDescription("")).rejects.toThrow(
        "descriptionName is required",
      );
    });
  });

  describe("request format", () => {
    it("should use POST method", async () => {
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("amazon");

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("POST");
    });

    it("should include description data in body", async () => {
      mockParseResponse.mockResolvedValue(createTestDescription());

      await insertDescription("amazon");

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
    });
  });
});
