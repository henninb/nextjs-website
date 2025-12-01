/**
 * Unit Tests for Date Validation Utilities
 */

import {
  isValidYYYYMMDDFormat,
  isValidISOFormat,
  isParseable,
  validateDateFormat,
  validateDateBoundaries,
  validateDate,
  validateDates,
  validateDateRange,
  normalizeDate,
  getDateFormatHint,
  detectDateFormat,
  validateDateNotFuture,
} from "../../utils/validation/dateValidation";

describe("Date Validation Utilities", () => {
  describe("isValidYYYYMMDDFormat", () => {
    it("should validate YYYY-MM-DD format", () => {
      expect(isValidYYYYMMDDFormat("2025-01-15")).toBe(true);
      expect(isValidYYYYMMDDFormat("2025-12-31")).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidYYYYMMDDFormat("2025-01-15T10:30:00")).toBe(false);
      expect(isValidYYYYMMDDFormat("01/15/2025")).toBe(false);
      expect(isValidYYYYMMDDFormat("2025-1-5")).toBe(false);
      expect(isValidYYYYMMDDFormat("20250115")).toBe(false);
    });
  });

  describe("isValidISOFormat", () => {
    it("should validate ISO 8601 format", () => {
      expect(isValidISOFormat("2025-01-15T10:30:00Z")).toBe(true);
      expect(isValidISOFormat("2025-01-15T10:30:00.123Z")).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidISOFormat("2025-01-15")).toBe(false);
      expect(isValidISOFormat("2025-01-15 10:30:00")).toBe(false);
    });
  });

  describe("isParseable", () => {
    it("should validate parseable dates", () => {
      expect(isParseable("2025-01-15")).toBe(true);
      expect(isParseable("2025-01-15T10:30:00Z")).toBe(true);
      expect(isParseable(new Date())).toBe(true);
    });

    it("should reject invalid dates", () => {
      expect(isParseable("invalid-date")).toBe(false);
      expect(isParseable("2025-13-45")).toBe(false);
    });
  });

  describe("validateDateFormat", () => {
    it("should validate Date objects", () => {
      const result = validateDateFormat(new Date("2025-01-15"), "testDate");

      expect(result.isValid).toBe(true);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });

    it("should validate YYYY-MM-DD strings", () => {
      const result = validateDateFormat("2025-01-15", "testDate", "YYYY-MM-DD");

      expect(result.isValid).toBe(true);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });

    it("should reject dates with time component when YYYY-MM-DD expected", () => {
      const result = validateDateFormat(
        "2025-01-15 10:30",
        "testDate",
        "YYYY-MM-DD",
      );

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("DATE_FORMAT_INVALID");
      expect(result.error?.message).toContain("remove time component");
    });

    it("should provide helpful error for date with slashes", () => {
      const result = validateDateFormat("01/15/2025", "testDate", "YYYY-MM-DD");

      expect(result.isValid).toBe(false);
      expect(result.error?.message).toContain("use hyphens, not slashes");
    });

    it("should handle null/undefined", () => {
      const result = validateDateFormat(null, "testDate");

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("DATE_REQUIRED");
    });

    it("should handle empty string", () => {
      const result = validateDateFormat("", "testDate");

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("DATE_EMPTY");
    });
  });

  describe("validateDateBoundaries", () => {
    const now = new Date();

    it("should validate date within past boundary", () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(now.getMonth() - 6);

      const error = validateDateBoundaries(sixMonthsAgo, "testDate", {
        pastYears: 1,
      });
      expect(error).toBeNull();
    });

    it("should reject date beyond past boundary", () => {
      const twoYearsAgo = new Date();
      twoYearsAgo.setFullYear(now.getFullYear() - 2);

      const error = validateDateBoundaries(twoYearsAgo, "testDate", {
        pastYears: 1,
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("DATE_TOO_OLD");
      expect(error?.message).toContain("cannot be more than 1 year");
    });

    it("should validate date within future boundary", () => {
      const sixMonthsFromNow = new Date();
      sixMonthsFromNow.setMonth(now.getMonth() + 6);

      const error = validateDateBoundaries(sixMonthsFromNow, "testDate", {
        futureYears: 1,
      });
      expect(error).toBeNull();
    });

    it("should reject date beyond future boundary", () => {
      const twoYearsFromNow = new Date();
      twoYearsFromNow.setFullYear(now.getFullYear() + 2);

      const error = validateDateBoundaries(twoYearsFromNow, "testDate", {
        futureYears: 1,
      });
      expect(error).not.toBeNull();
      expect(error?.code).toBe("DATE_TOO_FUTURE");
    });

    it("should validate with custom min/max dates", () => {
      const minDate = new Date("2024-01-01");
      const maxDate = new Date("2025-12-31");
      const testDate = new Date("2025-06-15");

      const error = validateDateBoundaries(testDate, "testDate", {
        minDate,
        maxDate,
      });
      expect(error).toBeNull();
    });
  });

  describe("validateDate", () => {
    it("should validate format and boundaries", () => {
      const result = validateDate("2025-01-15", "testDate", "YYYY-MM-DD", {
        pastYears: 1,
        futureYears: 1,
      });

      expect(result.isValid).toBe(true);
      expect(result.parsedDate).toBeInstanceOf(Date);
    });

    it("should fail on invalid format", () => {
      const result = validateDate("01/15/2025", "testDate", "YYYY-MM-DD");

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("DATE_FORMAT_INVALID");
    });

    it("should fail on boundary violation", () => {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

      const result = validateDate(
        threeYearsAgo.toISOString().split("T")[0],
        "testDate",
        "YYYY-MM-DD",
        { pastYears: 1 },
      );

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("DATE_TOO_OLD");
    });
  });

  describe("validateDates", () => {
    it("should validate multiple dates", () => {
      const dates = [
        {
          value: "2025-01-15",
          fieldName: "startDate",
          format: "YYYY-MM-DD" as const,
        },
        {
          value: "2025-06-15",
          fieldName: "endDate",
          format: "YYYY-MM-DD" as const,
        },
      ];

      const errors = validateDates(dates);
      expect(errors).toHaveLength(0);
    });

    it("should collect all errors from multiple dates", () => {
      const dates = [
        {
          value: "invalid-date",
          fieldName: "startDate",
          format: "YYYY-MM-DD" as const,
        },
        {
          value: "01/15/2025",
          fieldName: "endDate",
          format: "YYYY-MM-DD" as const,
        },
      ];

      const errors = validateDates(dates);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("validateDateRange", () => {
    it("should validate valid date range", () => {
      const errors = validateDateRange(
        "2025-01-15",
        "2025-06-15",
        "startDate",
        "endDate",
      );

      expect(errors).toHaveLength(0);
    });

    it("should reject start date after end date", () => {
      const errors = validateDateRange(
        "2025-06-15",
        "2025-01-15",
        "startDate",
        "endDate",
      );

      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.code === "DATE_RANGE_INVALID")).toBe(true);
    });

    it("should collect errors from invalid date formats", () => {
      const errors = validateDateRange(
        "invalid",
        "2025-06-15",
        "startDate",
        "endDate",
      );

      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe("normalizeDate", () => {
    it("should normalize Date object to YYYY-MM-DD", () => {
      const date = new Date("2025-01-15T10:30:00Z");
      const normalized = normalizeDate(date, "YYYY-MM-DD");

      expect(normalized).toBe("2025-01-15");
    });

    it("should normalize string to YYYY-MM-DD", () => {
      const normalized = normalizeDate("2025-01-15T10:30:00Z", "YYYY-MM-DD");

      expect(normalized).toBe("2025-01-15");
    });

    it("should normalize to ISO format", () => {
      const date = new Date("2025-01-15T10:30:00Z");
      const normalized = normalizeDate(date, "ISO");

      expect(normalized).toContain("2025-01-15T");
    });

    it("should return null for invalid input", () => {
      expect(normalizeDate(null, "YYYY-MM-DD")).toBeNull();
      expect(normalizeDate("invalid", "YYYY-MM-DD")).toBeNull();
    });
  });

  describe("getDateFormatHint", () => {
    it("should provide format hints", () => {
      expect(getDateFormatHint("YYYY-MM-DD")).toContain("YYYY-MM-DD");
      expect(getDateFormatHint("ISO")).toContain("ISO 8601");
    });
  });

  describe("detectDateFormat", () => {
    it("should detect YYYY-MM-DD format", () => {
      expect(detectDateFormat("2025-01-15")).toBe("YYYY-MM-DD");
    });

    it("should detect ISO format", () => {
      expect(detectDateFormat("2025-01-15T10:30:00Z")).toBe("ISO");
    });

    it("should return null for unknown format", () => {
      expect(detectDateFormat("01/15/2025")).toBeNull();
    });
  });

  describe("validateDateNotFuture", () => {
    it("should accept past dates", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const result = validateDateNotFuture(
        yesterday.toISOString().split("T")[0],
        "testDate",
      );

      expect(result.isValid).toBe(true);
    });

    it("should accept today's date", () => {
      const today = new Date().toISOString().split("T")[0];
      const result = validateDateNotFuture(today, "testDate");

      expect(result.isValid).toBe(true);
    });

    it("should reject future dates", () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const result = validateDateNotFuture(
        tomorrow.toISOString().split("T")[0],
        "testDate",
      );

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe("DATE_IN_FUTURE");
    });
  });
});
