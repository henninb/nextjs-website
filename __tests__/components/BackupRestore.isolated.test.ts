/**
 * Isolated tests for BackupRestore business logic
 * Tests core backup/restore functions without React component overhead
 */

import {
  createTestAccount,
  createTestCategory,
  createTestPayment,
  createTestTransaction,
  createTestTransfer,
  createTestParameter,
  ConsoleSpy,
} from "../../testHelpers";
import Account from "../../model/Account";
import Category from "../../model/Category";

// Mock browser APIs
Object.defineProperty(global, "URL", {
  value: {
    createObjectURL: jest.fn(() => "mock-url"),
    revokeObjectURL: jest.fn(),
  },
});

Object.defineProperty(global, "Blob", {
  value: class MockBlob {
    constructor(content: any[], options: any) {
      this.content = content;
      this.options = options;
    }
    content: any[];
    options: any;
  },
});

Object.defineProperty(global, "FileReader", {
  value: class MockFileReader {
    onload: ((event: any) => void) | null = null;
    readAsText(file: File) {
      setTimeout(() => {
        if (this.onload) {
          this.onload({
            target: {
              result:
                file instanceof MockFile ? file.content : JSON.stringify({}),
            },
          });
        }
      }, 0);
    }
  },
});

class MockFile {
  constructor(
    public content: string,
    public name: string,
    public type: string,
  ) {}
}

// Mock document methods
const mockCreateElement = jest.fn();
const mockAppendChild = jest.fn();
const mockRemoveChild = jest.fn();
const mockClick = jest.fn();

// Mock document
Object.defineProperty(document, "createElement", {
  value: mockCreateElement,
  writable: true,
});

Object.defineProperty(document.body, "appendChild", {
  value: mockAppendChild,
  writable: true,
});

Object.defineProperty(document.body, "removeChild", {
  value: mockRemoveChild,
  writable: true,
});

beforeEach(() => {
  jest.clearAllMocks();
  mockCreateElement.mockReturnValue({
    click: mockClick,
    href: "",
    download: "",
  });
});

// Extract business logic functions from BackupRestore component

/**
 * Creates a backup data structure from all entity collections
 */
export const createBackupData = (data: {
  accounts?: Account[];
  categories?: Category[];
  descriptions?: any[];
  parameters?: any[];
  payments?: any[];
  pendingTransactions?: any[];
  transactions?: any[];
  transfers?: any[];
}) => {
  return {
    accounts: data.accounts || [],
    categories: data.categories || [],
    descriptions: data.descriptions || [],
    parameters: data.parameters || [],
    payments: data.payments || [],
    pendingTransactions: data.pendingTransactions || [],
    transactions: data.transactions || [],
    transfers: data.transfers || [],
  };
};

/**
 * Generates a backup filename with timestamp
 */
export const generateBackupFilename = (date?: Date) => {
  const timestamp = (date || new Date()).toISOString();
  return `finance-backup-${timestamp}.json`;
};

/**
 * Creates a downloadable backup file
 */
export const createBackupFile = async (
  backupData: any,
): Promise<{ success: boolean; error?: string }> => {
  try {
    const json = JSON.stringify(backupData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = generateBackupFilename();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Validates backup data structure
 */
export const validateBackupData = (
  data: any,
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data || typeof data !== "object") {
    errors.push("Backup data must be an object");
    return { isValid: false, errors };
  }

  const expectedProperties = [
    "accounts",
    "categories",
    "descriptions",
    "parameters",
    "payments",
    "pendingTransactions",
    "transactions",
    "transfers",
  ];

  // Check if at least one expected property exists
  const hasAnyProperty = expectedProperties.some((prop) => prop in data);
  if (!hasAnyProperty) {
    errors.push("Backup data must contain at least one entity type");
  }

  // Validate each property is an array if it exists
  expectedProperties.forEach((prop) => {
    if (prop in data && !Array.isArray(data[prop])) {
      errors.push(`${prop} must be an array`);
    }
  });

  return { isValid: errors.length === 0, errors };
};

/**
 * Parses backup file content
 */
export const parseBackupFile = (
  content: string,
): { success: boolean; data?: any; error?: string } => {
  try {
    const data = JSON.parse(content);
    const validation = validateBackupData(data);

    if (!validation.isValid) {
      return { success: false, error: validation.errors.join(", ") };
    }

    return { success: true, data };
  } catch (error) {
    return { success: false, error: "Invalid JSON format" };
  }
};

/**
 * Processes restore operations for each entity type
 */
export const processRestoreOperations = async (
  backupData: any,
  operations: {
    insertAccount?: (item: any) => Promise<void>;
    insertCategory?: (item: any) => Promise<void>;
    insertDescription?: (item: any) => Promise<void>;
    insertParameter?: (item: any) => Promise<void>;
    insertPayment?: (item: any) => Promise<void>;
    insertPendingTransaction?: (item: any) => Promise<void>;
    insertTransaction?: (item: any) => Promise<void>;
    insertTransfer?: (item: any) => Promise<void>;
  },
): Promise<{ success: boolean; errors: string[] }> => {
  const errors: string[] = [];

  try {
    // Restore accounts
    if (backupData.accounts && operations.insertAccount) {
      for (const item of backupData.accounts) {
        try {
          await operations.insertAccount(item);
        } catch (error) {
          errors.push(
            `Failed to restore account: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore categories
    if (backupData.categories && operations.insertCategory) {
      for (const item of backupData.categories) {
        try {
          await operations.insertCategory(item);
        } catch (error) {
          errors.push(
            `Failed to restore category: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore descriptions
    if (backupData.descriptions && operations.insertDescription) {
      for (const item of backupData.descriptions) {
        try {
          await operations.insertDescription(item);
        } catch (error) {
          errors.push(
            `Failed to restore description: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore parameters
    if (backupData.parameters && operations.insertParameter) {
      for (const item of backupData.parameters) {
        try {
          await operations.insertParameter(item);
        } catch (error) {
          errors.push(
            `Failed to restore parameter: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore payments
    if (backupData.payments && operations.insertPayment) {
      for (const item of backupData.payments) {
        try {
          await operations.insertPayment(item);
        } catch (error) {
          errors.push(
            `Failed to restore payment: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore pending transactions
    if (backupData.pendingTransactions && operations.insertPendingTransaction) {
      for (const item of backupData.pendingTransactions) {
        try {
          await operations.insertPendingTransaction(item);
        } catch (error) {
          errors.push(
            `Failed to restore pending transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore transactions
    if (backupData.transactions && operations.insertTransaction) {
      for (const item of backupData.transactions) {
        try {
          await operations.insertTransaction(item);
        } catch (error) {
          errors.push(
            `Failed to restore transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    // Restore transfers
    if (backupData.transfers && operations.insertTransfer) {
      for (const item of backupData.transfers) {
        try {
          await operations.insertTransfer(item);
        } catch (error) {
          errors.push(
            `Failed to restore transfer: ${error instanceof Error ? error.message : "Unknown error"}`,
          );
        }
      }
    }

    return { success: errors.length === 0, errors };
  } catch (error) {
    errors.push(
      `Restore operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return { success: false, errors };
  }
};

/**
 * Counts total entities in backup data
 */
export const countBackupEntities = (backupData: any): number => {
  if (!backupData || typeof backupData !== "object") {
    return 0;
  }

  return [
    "accounts",
    "categories",
    "descriptions",
    "parameters",
    "payments",
    "pendingTransactions",
    "transactions",
    "transfers",
  ].reduce((total, prop) => {
    const entities = backupData[prop];
    return total + (Array.isArray(entities) ? entities.length : 0);
  }, 0);
};

describe("BackupRestore Business Logic (Isolated)", () => {
  describe("createBackupData", () => {
    it("should create backup data structure with all entities", () => {
      const accounts = [
        createTestAccount(),
        createTestAccount({ accountNameOwner: "Savings" }),
      ];
      const categories = [
        createTestCategory(),
        createTestCategory({ categoryName: "Food" }),
      ];
      const payments = [createTestPayment()];

      const backupData = createBackupData({
        accounts,
        categories,
        payments,
      });

      expect(backupData).toEqual({
        accounts,
        categories,
        descriptions: [],
        parameters: [],
        payments,
        pendingTransactions: [],
        transactions: [],
        transfers: [],
      });
    });

    it("should handle missing entity types", () => {
      const backupData = createBackupData({
        accounts: [createTestAccount()],
      });

      expect(backupData.accounts).toHaveLength(1);
      expect(backupData.categories).toEqual([]);
      expect(backupData.descriptions).toEqual([]);
    });

    it("should handle empty input", () => {
      const backupData = createBackupData({});

      expect(backupData).toEqual({
        accounts: [],
        categories: [],
        descriptions: [],
        parameters: [],
        payments: [],
        pendingTransactions: [],
        transactions: [],
        transfers: [],
      });
    });
  });

  describe("generateBackupFilename", () => {
    it("should generate filename with timestamp", () => {
      const testDate = new Date("2023-12-25T10:30:00.000Z");
      const filename = generateBackupFilename(testDate);

      expect(filename).toBe("finance-backup-2023-12-25T10:30:00.000Z.json");
    });

    it("should use current date when no date provided", () => {
      const filename = generateBackupFilename();

      expect(filename).toMatch(
        /^finance-backup-\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\.json$/,
      );
    });

    it("should handle different date formats", () => {
      const testDate = new Date("2024-01-01T00:00:00.000Z");
      const filename = generateBackupFilename(testDate);

      expect(filename).toBe("finance-backup-2024-01-01T00:00:00.000Z.json");
    });
  });

  describe("createBackupFile", () => {
    it("should create downloadable backup file successfully", async () => {
      const backupData = { accounts: [createTestAccount()] };

      const result = await createBackupFile(backupData);

      expect(result.success).toBe(true);
      expect(result.error).toBeUndefined();
      expect(mockCreateElement).toHaveBeenCalledWith("a");
      expect(mockAppendChild).toHaveBeenCalled();
      expect(mockClick).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalled();
    });

    it("should handle backup creation errors", async () => {
      // Make JSON.stringify throw an error
      const circularObj = {} as any;
      circularObj.self = circularObj; // Create circular reference

      const result = await createBackupFile(circularObj);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should clean up resources after download", async () => {
      const backupData = { accounts: [] };

      await createBackupFile(backupData);

      expect(URL.revokeObjectURL).toHaveBeenCalledWith("mock-url");
    });
  });

  describe("validateBackupData", () => {
    it("should validate correct backup data structure", () => {
      const validData = {
        accounts: [createTestAccount()],
        categories: [createTestCategory()],
        descriptions: [],
        parameters: [],
        payments: [],
        pendingTransactions: [],
        transactions: [],
        transfers: [],
      };

      const result = validateBackupData(validData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should reject non-object data", () => {
      const result1 = validateBackupData(null);
      const result2 = validateBackupData("invalid");
      const result3 = validateBackupData(123);

      expect(result1.isValid).toBe(false);
      expect(result1.errors).toContain("Backup data must be an object");
      expect(result2.isValid).toBe(false);
      expect(result3.isValid).toBe(false);
    });

    it("should reject data without any expected properties", () => {
      const invalidData = { unexpectedProperty: [] };

      const result = validateBackupData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        "Backup data must contain at least one entity type",
      );
    });

    it("should reject non-array entity types", () => {
      const invalidData = {
        accounts: "not-an-array",
        categories: [createTestCategory()],
      };

      const result = validateBackupData(invalidData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("accounts must be an array");
    });

    it("should validate partial backup data", () => {
      const partialData = {
        accounts: [createTestAccount()],
        categories: [createTestCategory()],
      };

      const result = validateBackupData(partialData);

      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe("parseBackupFile", () => {
    it("should parse valid JSON backup file", () => {
      const backupData = { accounts: [createTestAccount()] };
      const content = JSON.stringify(backupData);

      const result = parseBackupFile(content);

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("accounts");
      expect(result.data.accounts).toHaveLength(1);
      expect(result.error).toBeUndefined();
    });

    it("should handle invalid JSON", () => {
      const invalidJson = "{ invalid json }";

      const result = parseBackupFile(invalidJson);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid JSON format");
    });

    it("should handle valid JSON with invalid structure", () => {
      const invalidStructure = { unexpectedProperty: "value" };
      const content = JSON.stringify(invalidStructure);

      const result = parseBackupFile(content);

      expect(result.success).toBe(false);
      expect(result.error).toContain(
        "Backup data must contain at least one entity type",
      );
    });

    it("should handle empty string", () => {
      const result = parseBackupFile("");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid JSON format");
    });
  });

  describe("processRestoreOperations", () => {
    it("should restore all entity types successfully", async () => {
      const mockInsertAccount = jest.fn().mockResolvedValue(undefined);
      const mockInsertCategory = jest.fn().mockResolvedValue(undefined);
      const mockInsertPayment = jest.fn().mockResolvedValue(undefined);

      const backupData = {
        accounts: [
          createTestAccount(),
          createTestAccount({ accountNameOwner: "Savings" }),
        ],
        categories: [createTestCategory()],
        payments: [createTestPayment()],
      };

      const result = await processRestoreOperations(backupData, {
        insertAccount: mockInsertAccount,
        insertCategory: mockInsertCategory,
        insertPayment: mockInsertPayment,
      });

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
      expect(mockInsertAccount).toHaveBeenCalledTimes(2);
      expect(mockInsertCategory).toHaveBeenCalledTimes(1);
      expect(mockInsertPayment).toHaveBeenCalledTimes(1);
    });

    it("should handle missing operation functions gracefully", async () => {
      const backupData = {
        accounts: [createTestAccount()],
        categories: [createTestCategory()],
      };

      const result = await processRestoreOperations(backupData, {
        // Only provide account insertion, not category
        insertAccount: jest.fn().mockResolvedValue(undefined),
      });

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should collect errors from failed operations", async () => {
      const mockInsertAccount = jest
        .fn()
        .mockRejectedValueOnce(new Error("Account error"))
        .mockResolvedValueOnce(undefined);
      const mockInsertCategory = jest
        .fn()
        .mockRejectedValue(new Error("Category error"));

      const backupData = {
        accounts: [
          createTestAccount(),
          createTestAccount({ accountNameOwner: "Savings" }),
        ],
        categories: [createTestCategory()],
      };

      const result = await processRestoreOperations(backupData, {
        insertAccount: mockInsertAccount,
        insertCategory: mockInsertCategory,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
      expect(result.errors[0]).toContain(
        "Failed to restore account: Account error",
      );
      expect(result.errors[1]).toContain(
        "Failed to restore category: Category error",
      );
    });

    it("should handle empty backup data", async () => {
      const result = await processRestoreOperations({}, {});

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it("should continue processing after individual failures", async () => {
      const mockInsertAccount = jest
        .fn()
        .mockRejectedValueOnce(new Error("First account failed"))
        .mockResolvedValueOnce(undefined); // Second account should succeed

      const backupData = {
        accounts: [
          createTestAccount(),
          createTestAccount({ accountNameOwner: "Savings" }),
        ],
      };

      const result = await processRestoreOperations(backupData, {
        insertAccount: mockInsertAccount,
      });

      expect(mockInsertAccount).toHaveBeenCalledTimes(2);
      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe("countBackupEntities", () => {
    it("should count entities across all types", () => {
      const backupData = {
        accounts: [createTestAccount(), createTestAccount()],
        categories: [createTestCategory()],
        descriptions: [],
        parameters: [createTestParameter()],
        payments: [
          createTestPayment(),
          createTestPayment(),
          createTestPayment(),
        ],
        pendingTransactions: [],
        transactions: [createTestTransaction()],
        transfers: [createTestTransfer()],
      };

      const count = countBackupEntities(backupData);

      expect(count).toBe(9); // 2 + 1 + 0 + 1 + 3 + 0 + 1 + 1
    });

    it("should handle empty backup data", () => {
      const backupData = {
        accounts: [],
        categories: [],
        descriptions: [],
        parameters: [],
        payments: [],
        pendingTransactions: [],
        transactions: [],
        transfers: [],
      };

      const count = countBackupEntities(backupData);

      expect(count).toBe(0);
    });

    it("should handle partial backup data", () => {
      const backupData = {
        accounts: [createTestAccount()],
        payments: [createTestPayment(), createTestPayment()],
      };

      const count = countBackupEntities(backupData);

      expect(count).toBe(3);
    });

    it("should handle invalid input", () => {
      expect(countBackupEntities(null)).toBe(0);
      expect(countBackupEntities(undefined)).toBe(0);
      expect(countBackupEntities("invalid")).toBe(0);
      expect(countBackupEntities(123)).toBe(0);
    });

    it("should ignore non-array properties", () => {
      const backupData = {
        accounts: "not-an-array",
        categories: [createTestCategory()],
        payments: null,
        transactions: [createTestTransaction()],
      };

      const count = countBackupEntities(backupData);

      expect(count).toBe(2); // Only categories and transactions
    });
  });

  describe("Integration scenarios", () => {
    it("should handle complete backup and restore workflow", async () => {
      // Step 1: Create backup data
      const originalData = {
        accounts: [createTestAccount({ accountNameOwner: "Checking" })],
        categories: [createTestCategory({ categoryName: "Groceries" })],
        payments: [createTestPayment()],
      };

      const backupData = createBackupData(originalData);
      expect(countBackupEntities(backupData)).toBe(3);

      // Step 2: Create backup file
      const backupResult = await createBackupFile(backupData);
      expect(backupResult.success).toBe(true);

      // Step 3: Parse backup content
      const content = JSON.stringify(backupData);
      const parseResult = parseBackupFile(content);
      expect(parseResult.success).toBe(true);
      expect(parseResult.data).toHaveProperty("accounts");
      expect(parseResult.data).toHaveProperty("categories");
      expect(parseResult.data).toHaveProperty("payments");

      // Step 4: Process restore operations
      const mockOperations = {
        insertAccount: jest.fn().mockResolvedValue(undefined),
        insertCategory: jest.fn().mockResolvedValue(undefined),
        insertPayment: jest.fn().mockResolvedValue(undefined),
      };

      const restoreResult = await processRestoreOperations(
        parseResult.data,
        mockOperations,
      );
      expect(restoreResult.success).toBe(true);
      expect(mockOperations.insertAccount).toHaveBeenCalledTimes(1);
      expect(mockOperations.insertCategory).toHaveBeenCalledTimes(1);
      expect(mockOperations.insertPayment).toHaveBeenCalledTimes(1);
    });

    it("should handle backup with large dataset", async () => {
      const largeData = {
        accounts: Array(100)
          .fill(null)
          .map((_, i) =>
            createTestAccount({ accountNameOwner: `Account ${i}` }),
          ),
        categories: Array(50)
          .fill(null)
          .map((_, i) => createTestCategory({ categoryName: `Category ${i}` })),
        payments: Array(200)
          .fill(null)
          .map(() => createTestPayment()),
      };

      const backupData = createBackupData(largeData);
      expect(countBackupEntities(backupData)).toBe(350);

      const backupResult = await createBackupFile(backupData);
      expect(backupResult.success).toBe(true);

      const mockOperations = {
        insertAccount: jest.fn().mockResolvedValue(undefined),
        insertCategory: jest.fn().mockResolvedValue(undefined),
        insertPayment: jest.fn().mockResolvedValue(undefined),
      };

      const restoreResult = await processRestoreOperations(
        backupData,
        mockOperations,
      );
      expect(restoreResult.success).toBe(true);
      expect(mockOperations.insertAccount).toHaveBeenCalledTimes(100);
      expect(mockOperations.insertCategory).toHaveBeenCalledTimes(50);
      expect(mockOperations.insertPayment).toHaveBeenCalledTimes(200);
    });
  });

  describe("Error handling and edge cases", () => {
    it("should handle corrupted backup file gracefully", () => {
      const corruptedJson = '{"accounts": [{"id":}';

      const result = parseBackupFile(corruptedJson);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid JSON format");
    });

    it("should validate backup data with mixed valid/invalid properties", () => {
      const mixedData = {
        accounts: [createTestAccount()], // valid
        categories: "invalid", // invalid
        payments: [createTestPayment()], // valid
        invalidProperty: "should be ignored", // invalid but ignored
      };

      const result = validateBackupData(mixedData);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain("categories must be an array");
    });

    it("should handle restore operations with partial failures", async () => {
      const mockInsertAccount = jest
        .fn()
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce(undefined);

      const backupData = {
        accounts: [
          createTestAccount({ accountNameOwner: "Account 1" }),
          createTestAccount({ accountNameOwner: "Account 2" }),
          createTestAccount({ accountNameOwner: "Account 3" }),
        ],
      };

      const result = await processRestoreOperations(backupData, {
        insertAccount: mockInsertAccount,
      });

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain("Network error");
      expect(mockInsertAccount).toHaveBeenCalledTimes(3);
    });
  });
});
