import { updateValidationAmount } from "../../hooks/useValidationAmountUpdate";
import ValidationAmount from "../../model/ValidationAmount";
import { TransactionState } from "../../model/TransactionState";

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
    sanitizeNumericId: jest.fn((value: number) => value),
  },
}));

jest.mock("../../utils/cacheUtils", () => ({
  QueryKeys: {
    validationAmount: jest.fn(() => ["validationAmount"]),
  },
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
const mockSanitizeNumericId =
  InputSanitizer.sanitizeNumericId as jest.MockedFunction<
    typeof InputSanitizer.sanitizeNumericId
  >;

const createTestValidationAmount = (
  overrides: Partial<ValidationAmount> = {},
): ValidationAmount => ({
  validationId: 1,
  validationDate: new Date("2024-01-01T00:00:00.000Z"),
  accountId: 100,
  amount: 1000.0,
  transactionState: "cleared" as TransactionState,
  activeStatus: true,
  dateAdded: new Date("2024-01-01T10:00:00.000Z"),
  dateUpdated: new Date("2024-01-01T10:00:00.000Z"),
  ...overrides,
});

describe("useValidationAmountUpdate - updateValidationAmount", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFetchWithErrorHandling.mockResolvedValue({ status: 200 } as Response);
    mockSanitizeNumericId.mockImplementation((value: number) => value);
  });

  describe("endpoint and sanitization", () => {
    it("should sanitize old validationId for endpoint", async () => {
      const oldVal = createTestValidationAmount({ validationId: 42 });
      const newVal = createTestValidationAmount({ validationId: 42, amount: 2000 });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      expect(mockSanitizeNumericId).toHaveBeenCalledWith(42, "validationId");
    });

    it("should call fetchWithErrorHandling with correct PUT endpoint", async () => {
      const oldVal = createTestValidationAmount({ validationId: 42 });
      const newVal = createTestValidationAmount({ validationId: 42, amount: 2000 });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      expect(mockFetchWithErrorHandling).toHaveBeenCalledWith(
        "/api/validation/amount/42",
        expect.objectContaining({ method: "PUT" }),
      );
    });

    it("should use sanitized ID in endpoint URL", async () => {
      mockSanitizeNumericId.mockReturnValue(77);
      const oldVal = createTestValidationAmount({ validationId: 77 });
      const newVal = createTestValidationAmount({ amount: 500 });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      const [url] = mockFetchWithErrorHandling.mock.calls[0];
      expect(url).toBe("/api/validation/amount/77");
    });
  });

  describe("successful update", () => {
    it("should return the updated validation amount", async () => {
      const oldVal = createTestValidationAmount({ validationId: 1 });
      const newVal = createTestValidationAmount({ amount: 2500 });
      mockParseResponse.mockResolvedValue(newVal);

      const result = await updateValidationAmount(oldVal, newVal);

      expect(result).toStrictEqual(newVal);
    });

    it("should send new validation amount as JSON body", async () => {
      const oldVal = createTestValidationAmount({ validationId: 5 });
      const newVal = createTestValidationAmount({ validationId: 5, amount: 3000 });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      const body = JSON.parse(options?.body as string);
      expect(body.amount).toBe(3000);
    });

    it("should call parseResponse with the fetch response", async () => {
      const mockResponse = { status: 200 } as Response;
      mockFetchWithErrorHandling.mockResolvedValue(mockResponse);
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount({ amount: 1500 });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      expect(mockParseResponse).toHaveBeenCalledWith(mockResponse);
    });

    it("should update transaction state from cleared to outstanding", async () => {
      const oldVal = createTestValidationAmount({
        transactionState: "cleared" as TransactionState,
      });
      const newVal = createTestValidationAmount({
        transactionState: "outstanding" as TransactionState,
      });
      mockParseResponse.mockResolvedValue(newVal);

      const result = await updateValidationAmount(oldVal, newVal);

      expect(result.transactionState).toBe("outstanding");
    });

    it("should update amount value", async () => {
      const oldVal = createTestValidationAmount({ amount: 1000 });
      const newVal = createTestValidationAmount({ amount: 2000 });
      mockParseResponse.mockResolvedValue(newVal);

      const result = await updateValidationAmount(oldVal, newVal);

      expect(result.amount).toBe(2000);
    });

    it("should update activeStatus", async () => {
      const oldVal = createTestValidationAmount({ activeStatus: true });
      const newVal = createTestValidationAmount({ activeStatus: false });
      mockParseResponse.mockResolvedValue(newVal);

      const result = await updateValidationAmount(oldVal, newVal);

      expect(result.activeStatus).toBe(false);
    });

    it("should handle zero amount update", async () => {
      const oldVal = createTestValidationAmount({ amount: 1000 });
      const newVal = createTestValidationAmount({ amount: 0 });
      mockParseResponse.mockResolvedValue(newVal);

      const result = await updateValidationAmount(oldVal, newVal);

      expect(result.amount).toBe(0);
    });

    it("should handle large amount update", async () => {
      const oldVal = createTestValidationAmount({ amount: 100 });
      const newVal = createTestValidationAmount({ amount: 999999.99 });
      mockParseResponse.mockResolvedValue(newVal);

      const result = await updateValidationAmount(oldVal, newVal);

      expect(result.amount).toBe(999999.99);
    });
  });

  describe("error handling", () => {
    it("should propagate 404 not found error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Validation amount not found", 404),
      );
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount({ amount: 2000 });

      await expect(updateValidationAmount(oldVal, newVal)).rejects.toThrow(
        "Validation amount not found",
      );
    });

    it("should propagate 400 bad request error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Invalid validation amount data", 400),
      );
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount({ amount: -1 });

      await expect(updateValidationAmount(oldVal, newVal)).rejects.toThrow(
        "Invalid validation amount data",
      );
    });

    it("should propagate 500 server error", async () => {
      const { FetchError } = jest.requireMock("../../utils/fetchUtils");
      mockFetchWithErrorHandling.mockRejectedValue(
        new FetchError("Internal server error", 500),
      );
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount();

      await expect(updateValidationAmount(oldVal, newVal)).rejects.toThrow(
        "Internal server error",
      );
    });

    it("should propagate network errors", async () => {
      mockFetchWithErrorHandling.mockRejectedValue(
        new Error("Network request failed"),
      );
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount({ amount: 2000 });

      await expect(updateValidationAmount(oldVal, newVal)).rejects.toThrow(
        "Network request failed",
      );
    });
  });

  describe("request format", () => {
    it("should use PUT method", async () => {
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount({ amount: 2000 });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.method).toBe("PUT");
    });

    it("should include new validation amount data in body", async () => {
      const oldVal = createTestValidationAmount();
      const newVal = createTestValidationAmount({
        amount: 1500,
        transactionState: "outstanding" as TransactionState,
      });
      mockParseResponse.mockResolvedValue(newVal);

      await updateValidationAmount(oldVal, newVal);

      const [, options] = mockFetchWithErrorHandling.mock.calls[0];
      expect(options?.body).toBeDefined();
    });
  });

  describe("various IDs", () => {
    it.each([1, 10, 100, 1000, 99999])(
      "should construct correct endpoint for ID %d",
      async (id) => {
        const oldVal = createTestValidationAmount({ validationId: id });
        const newVal = createTestValidationAmount({ amount: 2000 });
        mockParseResponse.mockResolvedValue(newVal);

        await updateValidationAmount(oldVal, newVal);

        const [url] = mockFetchWithErrorHandling.mock.calls[0];
        expect(url).toBe(`/api/validation/amount/${id}`);
      },
    );
  });
});
