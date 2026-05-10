import { DataValidator, hookValidators } from "../../../utils/validation/validator";
import { FINANCIAL_LIMITS } from "../../../utils/validation/schemas";
import { SecurityLogger } from "../../../utils/validation/sanitization";

describe("validator direct coverage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.restoreAllMocks();
  });

  describe("entity validators", () => {
    it("validates account data successfully", () => {
      const result = DataValidator.validateAccount({
        accountNameOwner: "Checking_Main",
        accountType: "credit",
        activeStatus: true,
        moniker: "Mainaccount1",
        outstanding: "100.12",
        future: "50.01",
        cleared: "25.00",
        dateClosed: "2025-01-01T00:00:00.000Z",
        validationDate: "2025-02-01T00:00:00.000Z",
      });

      expect(result.success).toBe(true);
      expect(result.data?.accountNameOwner).toBe("checking_main");
    });

    it("returns a validation error result when account sanitization throws", () => {
      const result = DataValidator.validateAccount({
        accountNameOwner: "Checking",
        accountType: "checking",
        activeStatus: true,
        moniker: "Main account",
        outstanding: 0,
        future: 0,
        cleared: 0,
        dateClosed: "not-a-date",
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "validation",
        code: "ERROR",
      });
    });

    it("logs category validation failures", () => {
      const logSpy = jest
        .spyOn(SecurityLogger, "logValidationFailure")
        .mockImplementation(() => {});

      const result = DataValidator.validateCategory({
        categoryName: "",
        activeStatus: true,
      });

      expect(result.success).toBe(false);
      expect(logSpy).toHaveBeenCalled();
    });

    it("validates description data successfully", () => {
      const result = DataValidator.validateDescription({
        descriptionName: "Coffee purchase",
        activeStatus: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.descriptionName).toBe("Coffee purchase");
    });

    it("returns same-account error for valid transfer payloads", () => {
      const result = DataValidator.validateTransfer({
        sourceAccount: "Savings",
        destinationAccount: "Savings",
        transactionDate: "2025-01-15",
        amount: 42,
        activeStatus: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0]).toMatchObject({
        field: "accounts",
        code: "SAME_ACCOUNT_ERROR",
      });
    });

    it("returns a validation error result when transfer sanitization throws", () => {
      const result = DataValidator.validateTransfer({
        sourceAccount: "Savings",
        destinationAccount: "Checking",
        transactionDate: "2025-01-15T10:30:00",
        amount: 42,
        activeStatus: true,
      });

      expect(result.success).toBe(false);
      expect(result.errors?.[0].field).toBe("validation");
    });
  });

  describe("financial helpers", () => {
    it("returns boundary errors for excessive amount and future date", () => {
      const farFuture = new Date();
      farFuture.setFullYear(farFuture.getFullYear() + 2);

      const result = DataValidator.validateFinancialBoundaries({
        amount: FINANCIAL_LIMITS.MAX_AMOUNT + 1,
        transactionDate: farFuture.toISOString(),
      });

      expect(result.success).toBe(false);
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "AMOUNT_TOO_LARGE" }),
          expect.objectContaining({ code: "DATE_TOO_FUTURE" }),
        ]),
      );
    });

    it("detects suspicious amount patterns", () => {
      expect(DataValidator.isSuspiciousAmount(100000)).toBe(true);
      expect(DataValidator.isSuspiciousAmount(9999.5)).toBe(true);
      expect(DataValidator.isSuspiciousAmount(100000.123)).toBe(true);
      expect(DataValidator.isSuspiciousAmount(523.49)).toBe(false);
    });

    it("validates arrays and preserves item indexes for failures", () => {
      const validator = jest
        .fn()
        .mockReturnValueOnce({
          success: true,
          data: { id: 1 },
        })
        .mockReturnValueOnce({
          success: false,
          errors: [{ field: "amount", message: "bad", code: "BAD" }],
        })
        .mockReturnValueOnce({
          success: true,
          data: { id: 3 },
        });

      const result = DataValidator.validateFinancialArray([1, 2, 3], validator);

      expect(result.success).toBe(false);
      expect(result.validItems).toEqual([{ id: 1 }, { id: 3 }]);
      expect(result.errors).toEqual([
        {
          index: 1,
          errors: [{ field: "amount", message: "bad", code: "BAD" }],
        },
      ]);
    });
  });

  describe("rate limiting and hook validators", () => {
    it("applies client-side rate limiting and blocks after the max attempts", () => {
      const nowSpy = jest.spyOn(Date, "now").mockReturnValue(1700000000000);

      for (let i = 0; i < 10; i += 1) {
        expect(DataValidator.validateRateLimit("user1", "save")).toBe(true);
      }

      expect(DataValidator.validateRateLimit("user1", "save")).toBe(false);

      nowSpy.mockReturnValue(1700000000000 + 61000);
      expect(DataValidator.validateRateLimit("user1", "save")).toBe(true);
    });

    it("maps validator success through hookValidators.validateApiPayload", () => {
      const validator = jest.fn().mockReturnValue({
        success: true,
        data: { id: 1, name: "ok" },
      });

      const result = hookValidators.validateApiPayload(
        { input: true },
        validator,
        "hook-name",
      );

      expect(result).toEqual({
        isValid: true,
        validatedData: { id: 1, name: "ok" },
        errors: undefined,
      });
    });

    it("returns validator errors from hookValidators.validateApiPayload", () => {
      const validator = jest.fn().mockReturnValue({
        success: false,
        errors: [{ field: "name", message: "Required", code: "REQUIRED" }],
      });

      const result = hookValidators.validateApiPayload(
        { input: true },
        validator,
        "hook-name",
      );

      expect(result).toEqual({
        isValid: false,
        validatedData: undefined,
        errors: [{ field: "name", message: "Required", code: "REQUIRED" }],
      });
    });

    it("returns a rate-limit error when validateRateLimit fails", () => {
      const rateSpy = jest
        .spyOn(DataValidator, "validateRateLimit")
        .mockReturnValue(false);
      const validator = jest.fn();

      const result = hookValidators.validateApiPayload(
        { input: true },
        validator,
        "hook-name",
      );

      expect(rateSpy).toHaveBeenCalledWith("user", "hook-name");
      expect(validator).not.toHaveBeenCalled();
      expect(result).toEqual({
        isValid: false,
        errors: [
          {
            field: "rateLimit",
            message: "Too many requests. Please wait before trying again.",
            code: "RATE_LIMIT_EXCEEDED",
          },
        ],
      });
    });
  });
});
