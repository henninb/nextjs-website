import {
  DataValidator,
  InputSanitizer,
  FINANCIAL_LIMITS,
} from "../utils/validation";

describe("Input Validation and Sanitization", () => {
  describe("DataValidator.validateUser", () => {
    it("should validate valid user data", () => {
      const validUser = {
        username: "testuser123",
        password: "Password123!",
        firstName: "John",
        lastName: "Doe",
      };

      const result = DataValidator.validateUser(validUser);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("should reject invalid username", () => {
      const actuallyInvalidUser = {
        username: "ab", // Too short (less than 3 chars)
        password: "Password123!",
      };

      const result = DataValidator.validateUser(actuallyInvalidUser);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some((err) => err.field === "username")).toBe(true);
    });

    it("should reject weak password", () => {
      const weakPasswordUser = {
        username: "testuser",
        password: "123", // Too weak
      };

      const result = DataValidator.validateUser(weakPasswordUser);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      if (result.errors) {
        const hasPasswordError = result.errors.some(
          (err) => err.field === "password",
        );
        expect(hasPasswordError).toBe(true);
      }
    });
  });

  describe("DataValidator.validateTransaction", () => {
    it("should validate valid transaction", () => {
      const validTransaction = {
        accountType: "debit" as const,
        accountNameOwner: "test_account",
        transactionDate: new Date().toISOString(),
        description: "Test transaction",
        category: "groceries",
        amount: 25.99,
        transactionState: "outstanding" as const,
        transactionType: "expense" as const,
        activeStatus: true,
        reoccurringType: "onetime" as const,
        notes: "Test notes",
      };

      const result = DataValidator.validateTransaction(validTransaction);
      expect(result.success).toBe(true);
    });

    it("should reject transaction with excessive amount", () => {
      const invalidTransaction = {
        accountType: "debit" as const,
        accountNameOwner: "test_account",
        transactionDate: new Date().toISOString(),
        description: "Test transaction",
        category: "groceries",
        amount: FINANCIAL_LIMITS.MAX_AMOUNT + 1,
        transactionState: "outstanding" as const,
        transactionType: "expense" as const,
        activeStatus: true,
        reoccurringType: "onetime" as const,
        notes: "",
      };

      const result = DataValidator.validateTransaction(invalidTransaction);
      expect(result.success).toBe(false);
      expect(result.errors?.some((err) => err.field === "amount")).toBe(true);
    });

    it("should allow transaction with zero amount", () => {
      const zeroAmountTransaction = {
        accountType: "debit" as const,
        accountNameOwner: "test_account",
        transactionDate: new Date().toISOString(),
        description: "Test transaction",
        category: "groceries",
        amount: 0,
        transactionState: "outstanding" as const,
        transactionType: "expense" as const,
        activeStatus: true,
        reoccurringType: "onetime" as const,
        notes: "",
      };

      const result = DataValidator.validateTransaction(zeroAmountTransaction);
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
    });

    it("should validate transaction with undefined transactionType", () => {
      const undefinedTypeTransaction = {
        accountType: "debit" as const,
        accountNameOwner: "test_account",
        transactionDate: new Date().toISOString(),
        description: "Test transaction",
        category: "groceries",
        amount: 25.99,
        transactionState: "outstanding" as const,
        transactionType: undefined,
        activeStatus: true,
        reoccurringType: "onetime" as const,
        notes: "Test notes",
      };

      const result = DataValidator.validateTransaction(
        undefinedTypeTransaction,
      );
      expect(result.success).toBe(true);
      expect(result.data?.transactionType).toBe("undefined");
    });

    it("should validate transaction with string 'undefined' transactionType", () => {
      const stringUndefinedTypeTransaction = {
        accountType: "debit" as const,
        accountNameOwner: "test_account",
        transactionDate: new Date().toISOString(),
        description: "Test transaction",
        category: "groceries",
        amount: 25.99,
        transactionState: "outstanding" as const,
        transactionType: "undefined" as const,
        activeStatus: true,
        reoccurringType: "onetime" as const,
        notes: "Test notes",
      };

      const result = DataValidator.validateTransaction(
        stringUndefinedTypeTransaction,
      );
      expect(result.success).toBe(true);
      expect(result.data?.transactionType).toBe("undefined");
    });
  });

  describe("DataValidator.validatePayment", () => {
    it("should reject payment with same source and destination", () => {
      const invalidPayment = {
        paymentId: 1,
        accountNameOwner: "test_account",
        sourceAccount: "account1",
        destinationAccount: "account1", // Same as source
        transactionDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        amount: 100.0,
        activeStatus: true,
      };

      const result = DataValidator.validatePayment(invalidPayment);
      expect(result.success).toBe(false);
      expect(
        result.errors?.some((err) => err.code === "SAME_ACCOUNT_ERROR"),
      ).toBe(true);
    });

    it("should validate valid payment", () => {
      const validPayment = {
        paymentId: 1,
        accountNameOwner: "test_account",
        sourceAccount: "account1",
        destinationAccount: "account2",
        transactionDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        amount: 100.0,
        activeStatus: true,
      };

      const result = DataValidator.validatePayment(validPayment);
      expect(result.success).toBe(true);
    });
  });

  describe("InputSanitizer", () => {
    it("should sanitize HTML from text input", () => {
      const maliciousInput = '<script>alert("xss")</script>Hello World';
      const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("Hello World");
    });

    it("should sanitize account names", () => {
      const dirtyAccountName = "test@account#name!";
      const sanitized = InputSanitizer.sanitizeAccountName(dirtyAccountName);
      expect(sanitized).toBe("testaccountname"); // Special chars removed, no underscore preserved
    });

    it("should sanitize financial amounts", () => {
      expect(InputSanitizer.sanitizeAmount("$123.456")).toBe(123.46);
      expect(InputSanitizer.sanitizeAmount("abc")).toBe(0);
      expect(InputSanitizer.sanitizeAmount(123.456)).toBe(123.46);
    });

    it("should sanitize descriptions", () => {
      const maliciousDescription = '<script>alert("xss")</script>Grocery store';
      const sanitized =
        InputSanitizer.sanitizeDescription(maliciousDescription);
      expect(sanitized).not.toContain("<script>");
      expect(sanitized).toContain("Grocery store");
    });
  });

  describe("Financial Boundary Checks", () => {
    it("should detect suspicious amounts", () => {
      // Test with a round number over $10,000
      const suspiciousTransaction = {
        amount: 15000, // Exactly $15,000
        transactionDate: new Date().toISOString(),
      };

      const result = DataValidator.validateFinancialBoundaries(
        suspiciousTransaction,
      );
      expect(result.success).toBe(false);
      expect(
        result.errors?.some((err) => err.code === "SUSPICIOUS_AMOUNT"),
      ).toBe(true);
    });

    it("should reject dates too far in the past", () => {
      const oldTransaction = {
        amount: 100,
        transactionDate: new Date("2020-01-01").toISOString(), // Over a year ago
      };

      const result = DataValidator.validateFinancialBoundaries(oldTransaction);
      expect(result.success).toBe(false);
      expect(result.errors?.some((err) => err.code === "DATE_TOO_OLD")).toBe(
        true,
      );
    });

    it("should reject dates too far in the future", () => {
      const futureTransaction = {
        amount: 100,
        transactionDate: new Date("2030-01-01").toISOString(), // Too far in future
      };

      const result =
        DataValidator.validateFinancialBoundaries(futureTransaction);
      expect(result.success).toBe(false);
      expect(result.errors?.some((err) => err.code === "DATE_TOO_FUTURE")).toBe(
        true,
      );
    });
  });
});
