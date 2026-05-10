import {
  InputSanitizer,
  sanitize,
  SecurityLogger,
} from "../../../utils/validation/sanitization";

describe("sanitization additional coverage", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe("InputSanitizer specific branches", () => {
    it("sanitizes text, notes, username, password, and category values", () => {
      expect(InputSanitizer.sanitizeText("  hello \u0007   world  ")).toBe(
        "hello world",
      );
      expect(InputSanitizer.sanitizeNotes(" <b>note</b> ")).toBe("bnote/b");
      expect(InputSanitizer.sanitizeUsername(" User.Name! ")).toBe("username");
      expect(InputSanitizer.sanitizePassword("abc\u0000def\u0007")).toBe(
        "abcdef",
      );
      expect(InputSanitizer.sanitizeCategory(" Food & Dining <3 ")).toBe(
        "Food Dining 3",
      );
    });

    it("validates and normalizes email addresses", () => {
      expect(InputSanitizer.sanitizeEmail("  USER@Example.COM ")).toBe(
        "user@example.com",
      );
      expect(() => InputSanitizer.sanitizeEmail("userexample.com")).toThrow(
        "Missing @ symbol",
      );
      expect(() => InputSanitizer.sanitizeEmail("user@@example.com")).toThrow(
        "Multiple @ symbols found",
      );
      expect(() => InputSanitizer.sanitizeEmail("user@example")).toThrow(
        "Missing domain extension",
      );
    });

    it("sanitizes dates and local dates with detailed validation", () => {
      expect(InputSanitizer.sanitizeDate(new Date("2025-01-15T00:00:00.000Z"))).toBe(
        "2025-01-15T00:00:00.000Z",
      );
      expect(InputSanitizer.sanitizeLocalDate(new Date("2025-01-15T00:00:00.000Z"))).toBe(
        "2025-01-15",
      );
      expect(() => InputSanitizer.sanitizeDate("2025/01/15")).not.toThrow();
      expect(() => InputSanitizer.sanitizeDate("bad")).toThrow(
        "recognizable format",
      );
      expect(() => InputSanitizer.sanitizeLocalDate("20250115")).toThrow(
        "Add hyphens",
      );
      expect(() => InputSanitizer.sanitizeLocalDate("2025/01/15")).toThrow(
        "Use hyphens",
      );
      expect(() => InputSanitizer.sanitizeLocalDate("2025-01-15T10:30:00")).toThrow(
        "without time component",
      );
    });

    it("sanitizes GUIDs with friendly errors", () => {
      expect(
        InputSanitizer.sanitizeGuid("123E4567-E89B-12D3-A456-426614174000"),
      ).toBe("123e4567-e89b-12d3-a456-426614174000");

      expect(() => InputSanitizer.sanitizeGuid("")).toThrow("GUID cannot be empty");
      expect(() => InputSanitizer.sanitizeGuid("short")).toThrow("Too short");
      expect(() =>
        InputSanitizer.sanitizeGuid(
          "123e4567-e89b-12d3-a456-426614174000-extra",
        ),
      ).toThrow("Too long");
    });
  });

  describe("object sanitizers", () => {
    it("sanitizes user payloads", () => {
      expect(
        sanitize.user({
          userId: "12",
          username: " Test_User ",
          password: "p\u0000ass",
          firstName: " John ",
          lastName: " Doe ",
        }),
      ).toEqual({
        userId: 12,
        username: "test_user",
        password: "pass",
        firstName: "John",
        lastName: "Doe",
      });
    });

    it("sanitizes account payloads and applies defaults", () => {
      const result = sanitize.account({
        accountNameOwner: "My Checking!",
        accountType: " checking ",
        activeStatus: "yes",
        moniker: " Main ",
        outstanding: "$10.789",
        future: "20",
        cleared: 30.345,
      });

      expect(result.accountNameOwner).toBe("mychecking");
      expect(result.activeStatus).toBe(true);
      expect(result.outstanding).toBe(10.79);
      expect(result.dateClosed).toBe(new Date(0).toISOString());
    });

    it("sanitizes transaction, payment, transfer, category, and description payloads", () => {
      expect(
        sanitize.transaction({
          transactionId: "7",
          guid: "123e4567-e89b-12d3-a456-426614174000",
          accountId: "5",
          accountType: " checking ",
          accountNameOwner: "Owner One",
          transactionDate: "2025-01-15T00:00:00.000Z",
          description: '<b>Coffee</b>',
          category: "Food & Dining",
          amount: "$4.556",
          transactionState: " outstanding ",
          activeStatus: "1",
          reoccurringType: " monthly ",
          notes: "<note>",
        }),
      ).toMatchObject({
        transactionId: 7,
        accountId: 5,
        accountNameOwner: "ownerone",
        description: "bCoffeeb",
        category: "Food Dining",
        amount: 4.56,
        transactionType: "undefined",
        activeStatus: true,
      });

      expect(
        sanitize.payment({
          paymentId: "2",
          accountNameOwner: "Owner One",
          sourceAccount: "Savings 1",
          destinationAccount: "Checking 2",
          transactionDate: "2025-01-15",
          amount: "22.50",
          guidSource: "123e4567-e89b-12d3-a456-426614174000",
          activeStatus: "true",
        }),
      ).toMatchObject({
        paymentId: 2,
        sourceAccount: "savings1",
        destinationAccount: "checking2",
        amount: 22.5,
        activeStatus: true,
      });

      expect(
        sanitize.transfer({
          transferId: "3",
          sourceAccount: "Savings 1",
          destinationAccount: "Checking 2",
          transactionDate: "2025-01-15",
          amount: "12.34",
          activeStatus: 0,
        }),
      ).toMatchObject({
        transferId: 3,
        sourceAccount: "savings1",
        destinationAccount: "checking2",
        amount: 12.34,
        activeStatus: false,
      });

      expect(
        sanitize.category({
          categoryId: "4",
          category: "Gas & Fuel",
          activeStatus: "false",
        }),
      ).toMatchObject({
        categoryId: 4,
        categoryName: "Gas Fuel",
        activeStatus: false,
      });

      expect(
        sanitize.description({
          descriptionId: "5",
          description: "<b>Lunch</b>",
          activeStatus: undefined,
          descriptionCount: "9",
        }),
      ).toMatchObject({
        descriptionId: 5,
        descriptionName: "bLunchb",
        activeStatus: true,
        descriptionCount: 9,
      });
    });
  });

  describe("SecurityLogger", () => {
    it("logs sanitization attempts in development", () => {
      process.env.NODE_ENV = "development";
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

      SecurityLogger.logSanitizationAttempt("notes", "<bad>", "bad");

      expect(warnSpy).toHaveBeenCalled();
    });

    it("logs validation failures in development", () => {
      process.env.NODE_ENV = "development";
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      SecurityLogger.logValidationFailure(
        [{ field: "amount", message: "bad", code: "BAD" }],
        { amount: "oops" },
      );

      expect(errorSpy).toHaveBeenCalled();
    });

    it("does not log outside development", () => {
      process.env.NODE_ENV = "test";
      const warnSpy = jest.spyOn(console, "warn").mockImplementation(() => {});
      const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

      SecurityLogger.logSanitizationAttempt("notes", "<bad>", "bad");
      SecurityLogger.logValidationFailure(
        [{ field: "amount", message: "bad", code: "BAD" }],
        { amount: "oops" },
      );

      expect(warnSpy).not.toHaveBeenCalled();
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
