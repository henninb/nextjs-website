/**
 * Isolated tests for useTransactionUpdate business logic
 * Tests updateTransaction function without React Query overhead
 */

import {
  createFetchMock,
  createErrorFetchMock,
  ConsoleSpy,
  createTestTransaction,
} from "../../testHelpers";
import Transaction from "../../model/Transaction";

// Extract business logic functions from useTransactionUpdate

/**
 * Validates GUID format (UUID v4)
 */
export const isValidGuid = (guid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(guid);
};

/**
 * Sanitizes GUID for URL usage
 */
export const sanitizeGuid = (guid: string): string => {
  if (!isValidGuid(guid)) {
    throw new Error("Invalid GUID provided");
  }
  return encodeURIComponent(guid);
};

/**
 * Processes receipt image data by removing base64 prefix
 */
export const processReceiptImage = (transaction: Transaction): Transaction => {
  const processed = { ...transaction };

  if (processed.receiptImage !== undefined) {
    processed.receiptImage = {
      ...processed.receiptImage,
      image: processed.receiptImage.image.replace(
        /^data:image\/[a-z]+;base64,/,
        "",
      ),
    };
  }

  return processed;
};

/**
 * Updates transaction via API
 */
export const updateTransaction = async (
  newData: Transaction,
  oldData: Transaction,
): Promise<Transaction> => {
  try {
    const sanitizedGuid = sanitizeGuid(oldData.guid);
    const endpoint = `/api/transaction/update/${sanitizedGuid}`;

    // Process receipt image if present
    const processedData = processReceiptImage(newData);

    console.log("newData:" + JSON.stringify(processedData));

    const response = await fetch(endpoint, {
      method: "PUT",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(processedData),
    });

    if (!response.ok) {
      if (response.status === 404) {
        console.log("Resource not found (404).");
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error: any) {
    console.log(`An error occurred: ${error.message}`);
    throw error;
  }
};

describe("useTransactionUpdate Business Logic (Isolated)", () => {
  let consoleSpy: ConsoleSpy;

  beforeEach(() => {
    consoleSpy = new ConsoleSpy();
    jest.clearAllMocks();
  });

  afterEach(() => {
    consoleSpy.stop();
  });

  describe("isValidGuid", () => {
    it("should validate correct UUID v4 GUIDs", () => {
      const validGuids = [
        "123e4567-e89b-12d3-a456-426614174000",
        "550e8400-e29b-41d4-a716-446655440000",
        "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
        "6ba7b811-9dad-11d1-80b4-00c04fd430c8",
      ];

      validGuids.forEach(guid => {
        expect(isValidGuid(guid)).toBe(true);
      });
    });

    it("should reject invalid GUIDs", () => {
      const invalidGuids = [
        "123e4567-e89b-12d3-a456-42661417400", // Too short
        "123e4567-e89b-12d3-a456-4266141740000", // Too long
        "123e4567-e89b-12d3-a456-42661417400g", // Invalid character
        "123e4567-e89b-12d3-a456", // Missing parts
        "", // Empty
        "not-a-guid-at-all",
        "123456789012345678901234567890123456", // Wrong format
      ];

      invalidGuids.forEach(guid => {
        expect(isValidGuid(guid)).toBe(false);
      });
    });

    it("should handle edge cases", () => {
      expect(isValidGuid(null as any)).toBe(false);
      expect(isValidGuid(undefined as any)).toBe(false);
      expect(isValidGuid(123 as any)).toBe(false);
      expect(isValidGuid({} as any)).toBe(false);
    });
  });

  describe("sanitizeGuid", () => {
    it("should sanitize valid GUIDs", () => {
      const validGuid = "123e4567-e89b-12d3-a456-426614174000";
      const sanitized = sanitizeGuid(validGuid);

      expect(sanitized).toBe(encodeURIComponent(validGuid));
    });

    it("should handle GUIDs with special characters", () => {
      const guidWithSpecialChars = "123e4567-e89b-12d3-a456-426614174000";
      const sanitized = sanitizeGuid(guidWithSpecialChars);

      // Should be URL-encoded
      expect(sanitized).toBe(guidWithSpecialChars); // GUIDs don't have special chars that need encoding
    });

    it("should throw error for invalid GUIDs", () => {
      const invalidGuids = [
        "invalid-guid",
        "",
        "123",
        "not-a-guid-at-all",
      ];

      invalidGuids.forEach(guid => {
        expect(() => sanitizeGuid(guid)).toThrow("Invalid GUID provided");
      });
    });
  });

  describe("processReceiptImage", () => {
    it("should process receipt image by removing base64 prefix", () => {
      const transaction = createTestTransaction({
        receiptImage: {
          image: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...",
          filename: "receipt.jpg",
        },
      });

      const processed = processReceiptImage(transaction);

      expect(processed.receiptImage.image).toBe("/9j/4AAQSkZJRgABAQEAYABgAAD...");
      expect(processed.receiptImage.filename).toBe("receipt.jpg");
    });

    it("should handle different image formats", () => {
      const formats = [
        { input: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAA...", expected: "iVBORw0KGgoAAAANSUhEUgAAA..." },
        { input: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", expected: "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" },
        { input: "data:image/webp;base64,UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=", expected: "UklGRh4AAABXRUJQVlA4TBEAAAAvAAAAAAfQ//73v/+BiOh/AAA=" },
      ];

      formats.forEach(({ input, expected }) => {
        const transaction = createTestTransaction({
          receiptImage: { image: input, filename: "test.img" },
        });

        const processed = processReceiptImage(transaction);
        expect(processed.receiptImage.image).toBe(expected);
      });
    });

    it("should handle transaction without receipt image", () => {
      const transaction = createTestTransaction();
      // Ensure no receiptImage property
      delete (transaction as any).receiptImage;

      const processed = processReceiptImage(transaction);

      expect(processed.receiptImage).toBeUndefined();
      expect(processed).toEqual(transaction);
    });

    it("should preserve other transaction properties", () => {
      const transaction = createTestTransaction({
        description: "Test transaction",
        amount: 123.45,
        receiptImage: {
          image: "data:image/jpeg;base64,testdata",
          filename: "receipt.jpg",
        },
      });

      const processed = processReceiptImage(transaction);

      expect(processed.description).toBe("Test transaction");
      expect(processed.amount).toBe(123.45);
      expect(processed.receiptImage.filename).toBe("receipt.jpg");
    });

    it("should not mutate original transaction", () => {
      const transaction = createTestTransaction({
        receiptImage: {
          image: "data:image/jpeg;base64,original",
          filename: "original.jpg",
        },
      });
      const originalImageData = transaction.receiptImage.image;

      processReceiptImage(transaction);

      // Original should be unchanged
      expect(transaction.receiptImage.image).toBe(originalImageData);
    });
  });

  describe("updateTransaction", () => {
    describe("Successful updates", () => {
      it("should update transaction successfully", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          description: "Old description",
          amount: 100,
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          description: "New description",
          amount: 150,
        });

        const expectedResponse = { ...newTransaction, transactionId: 1 };

        global.fetch = createFetchMock(expectedResponse);
        consoleSpy.start();

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result).toEqual(expectedResponse);
        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/update/123e4567-e89b-12d3-a456-426614174000",
          {
            method: "PUT",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(newTransaction),
          },
        );

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("newData:");
      });

      it("should process receipt image during update", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          receiptImage: {
            image: "data:image/jpeg;base64,testdata123",
            filename: "receipt.jpg",
          },
        });

        global.fetch = createFetchMock(newTransaction);
        consoleSpy.start();

        await updateTransaction(newTransaction, oldTransaction);

        const calls = consoleSpy.getCalls();
        const loggedData = calls.log[0][0];

        // Should log the processed data (without base64 prefix)
        expect(loggedData).toContain("testdata123");
        expect(loggedData).not.toContain("data:image/jpeg;base64,");
      });

      it("should handle transaction state changes", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          transactionState: "outstanding",
          amount: 100,
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          transactionState: "cleared",
          amount: 100,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.transactionState).toBe("cleared");
      });

      it("should handle account changes", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          accountNameOwner: "OldAccount",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          accountNameOwner: "NewAccount",
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.accountNameOwner).toBe("NewAccount");
      });
    });

    describe("Error handling", () => {
      it("should handle invalid GUID in old transaction", async () => {
        const oldTransaction = createTestTransaction({
          guid: "invalid-guid",
        });
        const newTransaction = createTestTransaction();

        await expect(updateTransaction(newTransaction, oldTransaction))
          .rejects.toThrow("Invalid GUID provided");
      });

      it("should handle 404 not found errors", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
          json: jest.fn().mockResolvedValue({}),
        });
        consoleSpy.start();

        await expect(updateTransaction(newTransaction, oldTransaction))
          .rejects.toThrow("HTTP error! status: 404");

        const calls = consoleSpy.getCalls();
        expect(calls.log).toHaveLength(3);
        expect(calls.log[0][0]).toContain("newData:");
        expect(calls.log[1]).toEqual(["Resource not found (404)."]);
        expect(calls.log[2]).toEqual(["An error occurred: HTTP error! status: 404"]);
      });

      it("should handle 400 bad request errors", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 400,
          json: jest.fn().mockResolvedValue({}),
        });
        consoleSpy.start();

        await expect(updateTransaction(newTransaction, oldTransaction))
          .rejects.toThrow("HTTP error! status: 400");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("newData:");
        expect(calls.log[1]).toEqual(["An error occurred: HTTP error! status: 400"]);
      });

      it("should handle 500 server errors", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 500,
          json: jest.fn().mockResolvedValue({}),
        });
        consoleSpy.start();

        await expect(updateTransaction(newTransaction, oldTransaction))
          .rejects.toThrow("HTTP error! status: 500");
      });

      it("should handle network errors", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = jest.fn().mockRejectedValue(new Error("Network error"));
        consoleSpy.start();

        await expect(updateTransaction(newTransaction, oldTransaction))
          .rejects.toThrow("Network error");

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("newData:");
        expect(calls.log[1]).toEqual(["An error occurred: Network error"]);
      });
    });

    describe("Request format validation", () => {
      it("should use PUT method", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = createFetchMock(newTransaction);

        await updateTransaction(newTransaction, oldTransaction);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ method: "PUT" }),
        );
      });

      it("should include credentials", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = createFetchMock(newTransaction);

        await updateTransaction(newTransaction, oldTransaction);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({ credentials: "include" }),
        );
      });

      it("should send correct headers", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = createFetchMock(newTransaction);

        await updateTransaction(newTransaction, oldTransaction);

        expect(fetch).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
          }),
        );
      });

      it("should use sanitized GUID in endpoint", async () => {
        const guidWithSpecialChars = "123e4567-e89b-12d3-a456-426614174000";
        const oldTransaction = createTestTransaction({
          guid: guidWithSpecialChars,
        });
        const newTransaction = createTestTransaction();

        global.fetch = createFetchMock(newTransaction);

        await updateTransaction(newTransaction, oldTransaction);

        expect(fetch).toHaveBeenCalledWith(
          `/api/transaction/update/${encodeURIComponent(guidWithSpecialChars)}`,
          expect.any(Object),
        );
      });
    });

    describe("Business logic scenarios", () => {
      it("should handle amount changes", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          amount: 100.00,
          description: "Original amount",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          amount: 250.75,
          description: "Updated amount",
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.amount).toBe(250.75);
        expect(result.description).toBe("Updated amount");
      });

      it("should handle category and description changes", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          category: "Old Category",
          description: "Old description",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          category: "New Category",
          description: "New description",
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.category).toBe("New Category");
        expect(result.description).toBe("New description");
      });

      it("should handle date changes", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          transactionDate: new Date("2023-01-01"),
        });

        const newDate = new Date("2023-12-25");
        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          transactionDate: newDate,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.transactionDate).toEqual(newDate);
      });

      it("should handle notes and metadata updates", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          notes: "Old notes",
          activeStatus: true,
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          notes: "Updated notes with more details",
          activeStatus: false,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.notes).toBe("Updated notes with more details");
        expect(result.activeStatus).toBe(false);
      });

      it("should handle reoccurring type changes", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          reoccurringType: "none",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          reoccurringType: "monthly",
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.reoccurringType).toBe("monthly");
      });
    });

    describe("Edge cases", () => {
      it("should handle very large amounts", async () => {
        const largeAmount = 999999999.99;
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          amount: 100,
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          amount: largeAmount,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.amount).toBe(largeAmount);
      });

      it("should handle negative amounts", async () => {
        const negativeAmount = -500.25;
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          amount: 100,
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          amount: negativeAmount,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.amount).toBe(negativeAmount);
      });

      it("should handle special characters in descriptions", async () => {
        const specialDescription = "Transaction with special chars: !@#$%^&*()";
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          description: specialDescription,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.description).toBe(specialDescription);
      });

      it("should handle unicode characters", async () => {
        const unicodeDescription = "Transaction 测试 🚀 émojis";
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          description: unicodeDescription,
        });

        global.fetch = createFetchMock(newTransaction);

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result.description).toBe(unicodeDescription);
      });
    });

    describe("Console logging", () => {
      it("should log transaction data before API call", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction({
          description: "Logged transaction",
        });

        global.fetch = createFetchMock(newTransaction);
        consoleSpy.start();

        await updateTransaction(newTransaction, oldTransaction);

        const calls = consoleSpy.getCalls();
        expect(calls.log[0][0]).toContain("newData:");
        expect(calls.log[0][0]).toContain("Logged transaction");
      });

      it("should log 404 errors specifically", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = jest.fn().mockResolvedValue({
          ok: false,
          status: 404,
        });
        consoleSpy.start();

        try {
          await updateTransaction(newTransaction, oldTransaction);
        } catch (error) {
          // Expected
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log[1]).toEqual(["Resource not found (404)."]);
      });

      it("should log general errors", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
        });
        const newTransaction = createTestTransaction();

        global.fetch = jest.fn().mockRejectedValue(new Error("General error"));
        consoleSpy.start();

        try {
          await updateTransaction(newTransaction, oldTransaction);
        } catch (error) {
          // Expected
        }

        const calls = consoleSpy.getCalls();
        expect(calls.log[1]).toEqual(["An error occurred: General error"]);
      });
    });

    describe("Integration scenarios", () => {
      it("should handle complete transaction update workflow", async () => {
        const oldTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          description: "Original transaction",
          amount: 100.00,
          category: "Food",
          transactionState: "outstanding",
          notes: "Original notes",
        });

        const newTransaction = createTestTransaction({
          guid: "123e4567-e89b-12d3-a456-426614174000",
          description: "Updated transaction",
          amount: 150.75,
          category: "Entertainment",
          transactionState: "cleared",
          notes: "Updated with receipt",
          receiptImage: {
            image: "data:image/jpeg;base64,updatedImageData",
            filename: "updated_receipt.jpg",
          },
        });

        const expectedResponse = { ...newTransaction, transactionId: 42 };

        global.fetch = createFetchMock(expectedResponse);
        consoleSpy.start();

        const result = await updateTransaction(newTransaction, oldTransaction);

        expect(result).toEqual(expectedResponse);

        const calls = consoleSpy.getCalls();
        const loggedData = calls.log[0][0];
        expect(loggedData).toContain("Updated transaction");
        expect(loggedData).toContain("updatedImageData");
        expect(loggedData).not.toContain("data:image/jpeg;base64,");

        expect(fetch).toHaveBeenCalledWith(
          "/api/transaction/update/123e4567-e89b-12d3-a456-426614174000",
          expect.objectContaining({
            method: "PUT",
            credentials: "include",
            body: expect.stringContaining("updatedImageData"),
          }),
        );
      });
    });
  });
});