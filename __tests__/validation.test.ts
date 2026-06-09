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
        sourceAccount: "checking_test",
        destinationAccount: "checking_test", // Same as source
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
        sourceAccount: "checking_test",
        destinationAccount: "credit_test",
        transactionDate: new Date().toISOString().split("T")[0], // YYYY-MM-DD format
        amount: 100.0,
        activeStatus: true,
      };

      const result = DataValidator.validatePayment(validPayment);
      expect(result.success).toBe(true);
    });

    // #11: payment amount must be at least $0.01
    it("should reject payment amount below minimum ($0.01)", () => {
      const invalidPayment = {
        paymentId: 1,
        sourceAccount: "checking_test",
        destinationAccount: "credit_test",
        transactionDate: new Date().toISOString().split("T")[0],
        amount: 0.0,
        activeStatus: true,
      };

      const result = DataValidator.validatePayment(invalidPayment);
      expect(result.success).toBe(false);
      expect(result.errors?.some((err) => err.field === "amount")).toBe(true);
    });

    // #14: payment amount must not exceed backend NUMERIC(8,2) = 999,999.99
    it("should reject payment amount above maximum ($999,999.99)", () => {
      const invalidPayment = {
        paymentId: 1,
        sourceAccount: "checking_test",
        destinationAccount: "credit_test",
        transactionDate: new Date().toISOString().split("T")[0],
        amount: 1000000.0,
        activeStatus: true,
      };

      const result = DataValidator.validatePayment(invalidPayment);
      expect(result.success).toBe(false);
      expect(result.errors?.some((err) => err.field === "amount")).toBe(true);
    });

    // #12/#13: account names must match name_owner format (lowercase with underscore)
    it("should reject account name without underscore separator", () => {
      const invalidPayment = {
        paymentId: 1,
        sourceAccount: "checkingtest", // missing underscore
        destinationAccount: "credit_test",
        transactionDate: new Date().toISOString().split("T")[0],
        amount: 100.0,
        activeStatus: true,
      };

      const result = DataValidator.validatePayment(invalidPayment);
      expect(result.success).toBe(false);
      expect(
        result.errors?.some((err) => err.field === "sourceAccount"),
      ).toBe(true);
    });

    // #11/#14: boundary check — $999,999.99 is exactly the max and must pass
    it("should accept payment at maximum valid amount ($999,999.99)", () => {
      const validPayment = {
        paymentId: 1,
        sourceAccount: "checking_test",
        destinationAccount: "credit_test",
        transactionDate: new Date().toISOString().split("T")[0],
        amount: 999999.99,
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

    it("should prevent nested script tag attacks (incomplete multi-character sanitization)", () => {
      // This test verifies the fix for CodeQL alerts #37, #60, #61
      // New approach: simply remove all < and > characters
      const nestedScriptAttack =
        '<sc<script>ript>alert("xss")</sc</script>ript>';
      const sanitized = InputSanitizer.sanitizeHtml(nestedScriptAttack);
      expect(sanitized).not.toContain("<");
      expect(sanitized).not.toContain(">");
      // All < and > removed, leaving the text content
      expect(sanitized).toBe('scscriptriptalert("xss")/sc/scriptript');

      // Test another variant
      const doubleNested = '<<script>script>alert("xss")<</script>/script>';
      const sanitized2 = InputSanitizer.sanitizeHtml(doubleNested);
      expect(sanitized2).not.toContain("<");
      expect(sanitized2).not.toContain(">");
      expect(sanitized2).toBe('scriptscriptalert("xss")/script/script');

      // Test with space in closing tag (CodeQL alert #60)
      const spaceInTag = "<script>alert(1)</script >";
      const sanitized3 = InputSanitizer.sanitizeHtml(spaceInTag);
      expect(sanitized3).not.toContain("<");
      expect(sanitized3).not.toContain(">");
      expect(sanitized3).toBe("scriptalert(1)/script");
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
    it("should allow large legitimate amounts without flagging as suspicious", () => {
      // Test with a round number that used to be flagged
      const legitimateTransaction = {
        amount: 15000, // Exactly $15,000
        transactionDate: new Date().toISOString(),
      };

      const result = DataValidator.validateFinancialBoundaries(
        legitimateTransaction,
      );
      // Suspicious amount detection is now disabled to reduce false positives
      expect(result.success).toBe(true);
    });

    it("should allow dates far in the past", () => {
      const oldTransaction = {
        amount: 100,
        transactionDate: new Date("2020-01-01").toISOString(), // Over a year ago
      };

      const result = DataValidator.validateFinancialBoundaries(oldTransaction);
      expect(result.success).toBe(true);
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
