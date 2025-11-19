import { InputSanitizer } from "../../../utils/validation/sanitization";

describe("sanitization extensions", () => {
  describe("InputSanitizer.sanitizeParameterName", () => {
    it("should allow alphanumeric characters", () => {
      expect(InputSanitizer.sanitizeParameterName("param123")).toBe("param123");
      expect(InputSanitizer.sanitizeParameterName("ABC")).toBe("ABC");
      expect(InputSanitizer.sanitizeParameterName("test_param")).toBe(
        "test_param",
      );
    });

    it("should allow underscores, dots, and dashes", () => {
      expect(InputSanitizer.sanitizeParameterName("param_name")).toBe(
        "param_name",
      );
      expect(InputSanitizer.sanitizeParameterName("param.name")).toBe(
        "param.name",
      );
      expect(InputSanitizer.sanitizeParameterName("param-name")).toBe(
        "param-name",
      );
      expect(InputSanitizer.sanitizeParameterName("param_name.test-123")).toBe(
        "param_name.test-123",
      );
    });

    it("should remove special characters", () => {
      expect(InputSanitizer.sanitizeParameterName("param@name")).toBe(
        "paramname",
      );
      expect(InputSanitizer.sanitizeParameterName("param$name")).toBe(
        "paramname",
      );
      expect(InputSanitizer.sanitizeParameterName("param<>name")).toBe(
        "paramname",
      );
      expect(InputSanitizer.sanitizeParameterName("param&name")).toBe(
        "paramname",
      );
    });

    it("should trim whitespace", () => {
      expect(InputSanitizer.sanitizeParameterName("  param  ")).toBe("param");
      expect(InputSanitizer.sanitizeParameterName("\tparam\n")).toBe("param");
    });

    it("should limit length to 100 characters", () => {
      const longString = "a".repeat(150);
      const result = InputSanitizer.sanitizeParameterName(longString);
      expect(result).toHaveLength(100);
      expect(result).toBe("a".repeat(100));
    });

    it("should return empty string for non-string input", () => {
      expect(InputSanitizer.sanitizeParameterName(null as any)).toBe("");
      expect(InputSanitizer.sanitizeParameterName(undefined as any)).toBe("");
      expect(InputSanitizer.sanitizeParameterName(123 as any)).toBe("");
      expect(InputSanitizer.sanitizeParameterName({} as any)).toBe("");
    });

    it("should handle empty string", () => {
      expect(InputSanitizer.sanitizeParameterName("")).toBe("");
    });

    it("should handle string with only invalid characters", () => {
      expect(InputSanitizer.sanitizeParameterName("@#$%^&*()")).toBe("");
      expect(InputSanitizer.sanitizeParameterName("!@#$")).toBe("");
    });
  });

  describe("InputSanitizer.sanitizeNumericId", () => {
    it("should accept valid positive integers", () => {
      expect(InputSanitizer.sanitizeNumericId(1)).toBe(1);
      expect(InputSanitizer.sanitizeNumericId(123)).toBe(123);
      expect(InputSanitizer.sanitizeNumericId(999999)).toBe(999999);
    });

    it("should accept zero", () => {
      expect(InputSanitizer.sanitizeNumericId(0)).toBe(0);
    });

    it("should parse numeric strings", () => {
      expect(InputSanitizer.sanitizeNumericId("123")).toBe(123);
      expect(InputSanitizer.sanitizeNumericId("0")).toBe(0);
      expect(InputSanitizer.sanitizeNumericId("999")).toBe(999);
    });

    it("should throw on negative numbers", () => {
      expect(() => InputSanitizer.sanitizeNumericId(-1)).toThrow(
        "ID must be a positive number",
      );
      expect(() => InputSanitizer.sanitizeNumericId("-5")).toThrow(
        "ID must be a positive number",
      );
    });

    it("should throw on non-integer numbers", () => {
      expect(() => InputSanitizer.sanitizeNumericId(12.5)).toThrow(
        "ID must be a whole number",
      );
      expect(() => InputSanitizer.sanitizeNumericId(3.14159)).toThrow(
        "ID must be a whole number",
      );
    });

    it("should throw on NaN", () => {
      expect(() => InputSanitizer.sanitizeNumericId(NaN)).toThrow(
        "ID must be a valid number",
      );
      expect(() => InputSanitizer.sanitizeNumericId("not-a-number")).toThrow(
        "ID must be a valid number",
      );
    });

    it("should use custom field name in error message", () => {
      expect(() => InputSanitizer.sanitizeNumericId(-1, "userId")).toThrow(
        "userId must be a positive number",
      );
      expect(() =>
        InputSanitizer.sanitizeNumericId("abc", "accountId"),
      ).toThrow("accountId must be a valid number");
    });

    it("should use default field name when not provided", () => {
      expect(() => InputSanitizer.sanitizeNumericId(-1)).toThrow(
        "ID must be a positive number",
      );
    });

    it("should handle Infinity", () => {
      expect(() => InputSanitizer.sanitizeNumericId(Infinity)).toThrow(
        "ID must be a whole number",
      );
      expect(() => InputSanitizer.sanitizeNumericId(-Infinity)).toThrow(
        "ID must be a whole number",
      );
    });
  });

  describe("InputSanitizer.sanitizeForUrl", () => {
    it("should encode special characters", () => {
      expect(InputSanitizer.sanitizeForUrl("hello world")).toBe(
        "hello%20world",
      );
      expect(InputSanitizer.sanitizeForUrl("user@example.com")).toBe(
        "user%40example.com",
      );
      expect(InputSanitizer.sanitizeForUrl("price: $100")).toBe(
        "price%3A%20%24100",
      );
    });

    it("should encode URL-unsafe characters", () => {
      expect(InputSanitizer.sanitizeForUrl("a&b=c")).toBe("a%26b%3Dc");
      expect(InputSanitizer.sanitizeForUrl("path/to/file")).toBe(
        "path%2Fto%2Ffile",
      );
      expect(InputSanitizer.sanitizeForUrl("query?param=value")).toBe(
        "query%3Fparam%3Dvalue",
      );
    });

    it("should trim whitespace before encoding", () => {
      expect(InputSanitizer.sanitizeForUrl("  hello  ")).toBe("hello");
      expect(InputSanitizer.sanitizeForUrl("\tvalue\n")).toBe("value");
    });

    it("should handle already encoded strings", () => {
      // Should re-encode
      expect(InputSanitizer.sanitizeForUrl("hello%20world")).toBe(
        "hello%2520world",
      );
    });

    it("should preserve alphanumeric characters", () => {
      expect(InputSanitizer.sanitizeForUrl("abc123")).toBe("abc123");
      expect(InputSanitizer.sanitizeForUrl("ABC")).toBe("ABC");
    });

    it("should preserve some special characters", () => {
      // These are safe in URLs and encodeURIComponent preserves them
      expect(InputSanitizer.sanitizeForUrl("test-value")).toBe("test-value");
      expect(InputSanitizer.sanitizeForUrl("test_value")).toBe("test_value");
      expect(InputSanitizer.sanitizeForUrl("test.value")).toBe("test.value");
    });

    it("should return empty string for non-string input", () => {
      expect(InputSanitizer.sanitizeForUrl(null as any)).toBe("");
      expect(InputSanitizer.sanitizeForUrl(undefined as any)).toBe("");
      expect(InputSanitizer.sanitizeForUrl(123 as any)).toBe("");
      expect(InputSanitizer.sanitizeForUrl({} as any)).toBe("");
    });

    it("should handle empty string", () => {
      expect(InputSanitizer.sanitizeForUrl("")).toBe("");
    });

    it("should handle Unicode characters", () => {
      expect(InputSanitizer.sanitizeForUrl("café")).toBe("caf%C3%A9");
      expect(InputSanitizer.sanitizeForUrl("日本語")).toBe(
        "%E6%97%A5%E6%9C%AC%E8%AA%9E",
      );
    });
  });

  describe("InputSanitizer.sanitizeBoolean", () => {
    it("should return true for boolean true", () => {
      expect(InputSanitizer.sanitizeBoolean(true)).toBe(true);
    });

    it("should return false for boolean false", () => {
      expect(InputSanitizer.sanitizeBoolean(false)).toBe(false);
    });

    it("should convert string 'true' to true", () => {
      expect(InputSanitizer.sanitizeBoolean("true")).toBe(true);
      expect(InputSanitizer.sanitizeBoolean("TRUE")).toBe(true);
      expect(InputSanitizer.sanitizeBoolean("True")).toBe(true);
      expect(InputSanitizer.sanitizeBoolean("  true  ")).toBe(true);
    });

    it("should convert string '1' to true", () => {
      expect(InputSanitizer.sanitizeBoolean("1")).toBe(true);
    });

    it("should convert string 'yes' to true", () => {
      expect(InputSanitizer.sanitizeBoolean("yes")).toBe(true);
      expect(InputSanitizer.sanitizeBoolean("YES")).toBe(true);
      expect(InputSanitizer.sanitizeBoolean("Yes")).toBe(true);
      expect(InputSanitizer.sanitizeBoolean("  yes  ")).toBe(true);
    });

    it("should convert string 'false' to false", () => {
      expect(InputSanitizer.sanitizeBoolean("false")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("FALSE")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("False")).toBe(false);
    });

    it("should convert string '0' to false", () => {
      expect(InputSanitizer.sanitizeBoolean("0")).toBe(false);
    });

    it("should convert string 'no' to false", () => {
      expect(InputSanitizer.sanitizeBoolean("no")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("NO")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("No")).toBe(false);
    });

    it("should convert empty string to false", () => {
      expect(InputSanitizer.sanitizeBoolean("")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("   ")).toBe(false);
    });

    it("should convert arbitrary strings to false", () => {
      expect(InputSanitizer.sanitizeBoolean("random")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("hello")).toBe(false);
      expect(InputSanitizer.sanitizeBoolean("2")).toBe(false);
    });

    it("should convert number 1 to true", () => {
      expect(InputSanitizer.sanitizeBoolean(1)).toBe(true);
      expect(InputSanitizer.sanitizeBoolean(5)).toBe(true);
      expect(InputSanitizer.sanitizeBoolean(-1)).toBe(true);
    });

    it("should convert number 0 to false", () => {
      expect(InputSanitizer.sanitizeBoolean(0)).toBe(false);
    });

    it("should convert null to false", () => {
      expect(InputSanitizer.sanitizeBoolean(null)).toBe(false);
    });

    it("should convert undefined to false", () => {
      expect(InputSanitizer.sanitizeBoolean(undefined)).toBe(false);
    });

    it("should convert empty array to true (truthy in JS)", () => {
      expect(InputSanitizer.sanitizeBoolean([])).toBe(true);
    });

    it("should convert non-empty array to true", () => {
      expect(InputSanitizer.sanitizeBoolean([1])).toBe(true);
      expect(InputSanitizer.sanitizeBoolean([1, 2, 3])).toBe(true);
    });

    it("should convert empty object to true (truthy in JS)", () => {
      expect(InputSanitizer.sanitizeBoolean({})).toBe(true);
    });

    it("should convert non-empty object to true", () => {
      expect(InputSanitizer.sanitizeBoolean({ key: "value" })).toBe(true);
    });
  });

  describe("Integration: Real-world scenarios", () => {
    it("should sanitize parameter configuration object", () => {
      const paramName = InputSanitizer.sanitizeParameterName(
        "  api.endpoint_url-v2  ",
      );
      expect(paramName).toBe("api.endpoint_url-v2");
    });

    it("should sanitize and validate user ID from URL", () => {
      const userId = InputSanitizer.sanitizeNumericId("123", "userId");
      expect(userId).toBe(123);
    });

    it("should prepare account name for URL", () => {
      const accountName = "chase brian";
      const sanitizedForUrl = InputSanitizer.sanitizeForUrl(accountName);
      expect(sanitizedForUrl).toBe("chase%20brian");
      // This can then be used in a URL like /api/account/${sanitizedForUrl}
    });

    it("should handle activeStatus toggle", () => {
      const activeStatusFromForm = "true";
      const sanitized = InputSanitizer.sanitizeBoolean(activeStatusFromForm);
      expect(sanitized).toBe(true);
    });

    it("should handle parameter value from config", () => {
      const config = {
        paramName: "  timeout.seconds-max  ",
        paramValue: "30",
        isEnabled: "true",
      };

      const sanitizedConfig = {
        paramName: InputSanitizer.sanitizeParameterName(config.paramName),
        paramValue: InputSanitizer.sanitizeNumericId(
          config.paramValue,
          "paramValue",
        ),
        isEnabled: InputSanitizer.sanitizeBoolean(config.isEnabled),
      };

      expect(sanitizedConfig).toEqual({
        paramName: "timeout.seconds-max",
        paramValue: 30,
        isEnabled: true,
      });
    });

    it("should build safe query string", () => {
      const category = "gas & groceries";
      const amount = "100.50";
      const isActive = "yes";

      const queryParams = new URLSearchParams({
        category: InputSanitizer.sanitizeForUrl(category),
        minAmount: amount, // Let URLSearchParams handle number encoding
        active: InputSanitizer.sanitizeBoolean(isActive).toString(),
      });

      expect(queryParams.toString()).toContain(
        "category=gas%2520%2526%2520groceries",
      );
      expect(queryParams.toString()).toContain("active=true");
    });
  });
});
