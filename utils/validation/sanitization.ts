// Lightweight sanitizer used both server- and client-side, no external deps
const purify = {
  sanitize: (input: string) =>
    typeof input === "string"
      ? input
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
          .replace(/<[^>]*>/g, "")
          .trim()
      : "",
};

/**
 * Sanitization utilities for preventing XSS and injection attacks
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content - removes all potentially dangerous HTML
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== "string") return "";

    // Our purify implementation already strips tags and script blocks
    return purify.sanitize(input);
  }

  /**
   * Sanitize text input - basic text cleaning
   */
  static sanitizeText(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "") // Remove control characters
      .replace(/\s+/g, " "); // Normalize whitespace
  }

  /**
   * Sanitize financial amount - ensures proper number format
   */
  static sanitizeAmount(input: number | string): number {
    if (typeof input === "number") {
      return Math.round(input * 100) / 100; // Round to 2 decimal places
    }

    if (typeof input === "string") {
      // Remove all non-numeric characters except decimal point and minus sign
      const cleaned = input.replace(/[^-0-9.]/g, "");
      const parsed = parseFloat(cleaned);

      if (isNaN(parsed)) return 0;

      return Math.round(parsed * 100) / 100;
    }

    return 0;
  }

  /**
   * Sanitize account name - allows only safe characters
   */
  static sanitizeAccountName(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, "") // Only allow alphanumeric, underscore, hyphen
      .toLowerCase()
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize description - allows safe characters for descriptions
   */
  static sanitizeDescription(input: string): string {
    if (typeof input !== "string") return "";

    // Allow alphanumeric, spaces, and common punctuation
    const sanitized = input
      .replace(/[<>\"'&]/g, "") // Remove dangerous HTML characters
      .replace(/[^\w\s\-.,!?()[\]{}:;]/g, "") // Only allow safe characters
      .trim()
      .substring(0, 1000); // Limit length

    return this.sanitizeHtml(sanitized);
  }

  /**
   * Sanitize category name
   */
  static sanitizeCategory(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .trim()
      .replace(/[^a-zA-Z0-9\s_-]/g, "") // Only allow safe characters
      .replace(/\s+/g, " ") // Normalize spaces
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize notes field - more permissive than description but still safe
   */
  static sanitizeNotes(input: string): string {
    if (typeof input !== "string") return "";

    // Allow more characters for notes but still prevent XSS
    const sanitized = input
      .replace(/[<>]/g, "") // Remove angle brackets
      .trim()
      .substring(0, 2000); // Limit length

    return this.sanitizeHtml(sanitized);
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== "string") {
      throw new Error(
        `Email must be a string. Received: ${typeof input}`
      );
    }

    if (input.trim() === "") {
      throw new Error("Email cannot be empty");
    }

    const trimmed = input.trim().toLowerCase();

    // Basic email validation (RFC5322-lite)
    const emailRegex =
      /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i;

    if (!emailRegex.test(trimmed)) {
      let hint = "";
      if (!trimmed.includes("@")) {
        hint = " (Missing @ symbol)";
      } else if (trimmed.split("@").length > 2) {
        hint = " (Multiple @ symbols found)";
      } else if (!trimmed.includes(".")) {
        hint = " (Missing domain extension like .com)";
      }

      throw new Error(
        `Invalid email format${hint}. You provided: "${input}". Example: user@example.com`
      );
    }

    // Simple normalization: lowercase, trim
    return trimmed;
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, "") // Only alphanumeric and underscore
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  /**
   * Sanitize password - minimal sanitization to preserve intended password
   */
  static sanitizePassword(input: string): string {
    if (typeof input !== "string") return "";

    // Only remove null bytes and control characters
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  }

  /**
   * Sanitize date string
   * Converts various date formats to ISO string format
   * Provides detailed error messages for invalid dates
   */
  static sanitizeDate(input: string | Date): string {
    if (input instanceof Date) {
      if (isNaN(input.getTime())) {
        throw new Error(
          "Invalid date object provided. Date must be a valid Date instance."
        );
      }
      return input.toISOString();
    }

    if (typeof input !== "string") {
      throw new Error(
        `Date must be a string or Date object. Received: ${typeof input}`
      );
    }

    if (input.trim() === "") {
      throw new Error("Date cannot be empty");
    }

    // Try to parse the date
    const date = new Date(input);

    if (isNaN(date.getTime())) {
      // Provide specific feedback about what might be wrong
      let hint = "";

      if (input.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // Format looks correct, might be invalid date values
        hint = " (Check if day/month values are valid, e.g., 2025-02-30 is invalid)";
      } else if (input.includes("/")) {
        hint = " (Use hyphens instead of slashes: YYYY-MM-DD)";
      } else if (!input.includes("-")) {
        hint = " (Date must be in a recognizable format like YYYY-MM-DD or ISO 8601)";
      } else if (input.length < 10) {
        hint = " (Date string is too short, expected at least YYYY-MM-DD)";
      }

      throw new Error(
        `Invalid date format. Could not parse: "${input}"${hint}. Example valid date: 2025-01-15`
      );
    }

    return date.toISOString();
  }

  /**
   * Sanitize date to LocalDate format (YYYY-MM-DD)
   * Used for backend APIs that expect LocalDate instead of full timestamps
   * IMPORTANT: This format does NOT accept time components
   */
  static sanitizeLocalDate(input: string | Date): string {
    if (input instanceof Date) {
      if (isNaN(input.getTime())) {
        throw new Error(
          "Invalid date object provided. Date must be a valid Date instance."
        );
      }
      return input.toISOString().split("T")[0];
    }

    if (typeof input !== "string") {
      throw new Error(
        `Date must be a string or Date object. Received: ${typeof input}`
      );
    }

    if (input.trim() === "") {
      throw new Error("Date cannot be empty");
    }

    // Check if input has time component (which is invalid for LocalDate)
    if (input.includes("T") || input.includes(":")) {
      throw new Error(
        `Date must be in YYYY-MM-DD format without time component. You provided: "${input}". Remove the time portion (e.g., use "2025-01-15" instead of "2025-01-15 10:30" or "2025-01-15T10:30:00")`
      );
    }

    // Validate YYYY-MM-DD format
    const localDatePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!localDatePattern.test(input)) {
      let hint = "";

      if (input.includes("/")) {
        hint = " (Use hyphens instead of slashes)";
      } else if (input.match(/^\d{4}\d{2}\d{2}$/)) {
        hint = " (Add hyphens between year, month, and day)";
      } else if (input.split("-").length !== 3) {
        hint = " (Format should have exactly two hyphens: YYYY-MM-DD)";
      }

      throw new Error(
        `Date must be in YYYY-MM-DD format${hint}. You provided: "${input}". Example: 2025-01-15`
      );
    }

    // Try to parse the date to ensure it's valid
    const date = new Date(input);

    if (isNaN(date.getTime())) {
      throw new Error(
        `Invalid date values. "${input}" does not represent a valid calendar date. Check if day/month values are correct (e.g., February 30th doesn't exist)`
      );
    }

    // Return the input as-is since it's already in YYYY-MM-DD format
    return input;
  }

  /**
   * Sanitize GUID/UUID
   */
  static sanitizeGuid(input: string): string {
    if (typeof input !== "string") {
      throw new Error(
        `GUID must be a string. Received: ${typeof input}`
      );
    }

    if (input.trim() === "") {
      throw new Error("GUID cannot be empty");
    }

    const cleaned = input.replace(/[^a-fA-F0-9-]/g, "").toLowerCase();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidV4Regex.test(cleaned)) {
      let hint = "";
      if (cleaned.length < 36) {
        hint = " (Too short, UUID should be 36 characters with hyphens)";
      } else if (cleaned.length > 36) {
        hint = " (Too long, UUID should be 36 characters with hyphens)";
      } else if (!cleaned.includes("-")) {
        hint = " (Missing hyphens, format should be: 8-4-4-4-12 characters)";
      }

      throw new Error(
        `Invalid GUID/UUID format${hint}. You provided: "${input}". Example: 123e4567-e89b-12d3-a456-426614174000`
      );
    }

    return cleaned;
  }

  /**
   * Sanitize parameter name (key)
   * Only allows safe characters for parameter names
   */
  static sanitizeParameterName(input: string): string {
    if (typeof input !== "string") return "";

    return input
      .trim()
      .replace(/[^a-zA-Z0-9_.-]/g, "") // Only alphanumeric, underscore, dot, dash
      .slice(0, 100); // Limit length
  }

  /**
   * Sanitize numeric ID
   * Ensures ID is a positive integer
   */
  static sanitizeNumericId(
    input: number | string,
    fieldName: string = "ID",
  ): number {
    if (input === null || input === undefined) {
      throw new Error(`${fieldName} is required and cannot be null or undefined`);
    }

    let numId: number;

    if (typeof input === "string") {
      if (input.trim() === "") {
        throw new Error(`${fieldName} cannot be empty`);
      }
      numId = parseInt(input, 10);
    } else if (typeof input === "number") {
      numId = input;
    } else {
      throw new Error(
        `${fieldName} must be a number or numeric string. Received: ${typeof input}`
      );
    }

    if (isNaN(numId)) {
      throw new Error(
        `${fieldName} must be a valid number. You provided: "${input}"`
      );
    }

    if (!Number.isInteger(numId)) {
      throw new Error(
        `${fieldName} must be a whole number (no decimals). You provided: ${input}`
      );
    }

    if (numId < 0) {
      throw new Error(
        `${fieldName} must be a positive number (0 or greater). You provided: ${input}`
      );
    }

    return numId;
  }

  /**
   * Sanitize for URL usage
   * Properly encodes value for use in URLs
   */
  static sanitizeForUrl(value: string): string {
    if (typeof value !== "string") return "";
    return encodeURIComponent(value.trim());
  }

  /**
   * Sanitize boolean value
   * Converts various truthy/falsy values to boolean
   */
  static sanitizeBoolean(input: any): boolean {
    if (typeof input === "boolean") return input;
    if (typeof input === "string") {
      const lower = input.toLowerCase().trim();
      return lower === "true" || lower === "1" || lower === "yes";
    }
    if (typeof input === "number") return input !== 0;
    return Boolean(input);
  }
}

/**
 * Comprehensive sanitization for different data types
 */
export const sanitize = {
  user: (data: any) => ({
    userId: data.userId ? parseInt(data.userId) : undefined,
    username: InputSanitizer.sanitizeUsername(data.username),
    password: InputSanitizer.sanitizePassword(data.password),
    firstName: data.firstName
      ? InputSanitizer.sanitizeText(data.firstName)
      : undefined,
    lastName: data.lastName
      ? InputSanitizer.sanitizeText(data.lastName)
      : undefined,
  }),

  account: (data: any) => ({
    accountId: data.accountId ? parseInt(data.accountId) : undefined,
    accountNameOwner: InputSanitizer.sanitizeAccountName(data.accountNameOwner),
    accountType: InputSanitizer.sanitizeText(data.accountType),
    activeStatus: Boolean(data.activeStatus),
    moniker: InputSanitizer.sanitizeText(data.moniker),
    outstanding: InputSanitizer.sanitizeAmount(data.outstanding),
    future: InputSanitizer.sanitizeAmount(data.future),
    cleared: InputSanitizer.sanitizeAmount(data.cleared),
    dateClosed: data.dateClosed
      ? InputSanitizer.sanitizeDate(data.dateClosed)
      : new Date(0).toISOString(), // Default to January 1, 1970 for non-closed accounts
    validationDate: data.validationDate
      ? InputSanitizer.sanitizeDate(data.validationDate)
      : undefined,
    dateAdded: data.dateAdded
      ? InputSanitizer.sanitizeDate(data.dateAdded)
      : undefined,
    dateUpdated: data.dateUpdated
      ? InputSanitizer.sanitizeDate(data.dateUpdated)
      : undefined,
  }),

  transaction: (data: any) => ({
    transactionId: data.transactionId
      ? parseInt(data.transactionId)
      : undefined,
    guid: data.guid ? InputSanitizer.sanitizeGuid(data.guid) : undefined,
    accountId: data.accountId ? parseInt(data.accountId) : undefined,
    accountType: InputSanitizer.sanitizeText(data.accountType),
    accountNameOwner: InputSanitizer.sanitizeAccountName(data.accountNameOwner),
    transactionDate: InputSanitizer.sanitizeDate(data.transactionDate),
    description: InputSanitizer.sanitizeDescription(data.description),
    category: InputSanitizer.sanitizeCategory(data.category),
    amount: InputSanitizer.sanitizeAmount(data.amount),
    transactionState: InputSanitizer.sanitizeText(data.transactionState),
    transactionType:
      data.transactionType !== undefined
        ? InputSanitizer.sanitizeText(data.transactionType)
        : "undefined",
    activeStatus: Boolean(data.activeStatus),
    reoccurringType: InputSanitizer.sanitizeText(data.reoccurringType),
    notes: InputSanitizer.sanitizeNotes(data.notes || ""),
    dueDate: data.dueDate
      ? InputSanitizer.sanitizeDate(data.dueDate)
      : undefined,
  }),

  payment: (data: any) => {
    console.log("[sanitization.ts] Payment BEFORE sanitization:", JSON.stringify(data));
    const sanitized = {
      paymentId: data.paymentId ? parseInt(data.paymentId) : undefined,
      accountNameOwner: data.accountNameOwner
        ? InputSanitizer.sanitizeAccountName(data.accountNameOwner)
        : undefined,
      sourceAccount: InputSanitizer.sanitizeAccountName(data.sourceAccount),
      destinationAccount: InputSanitizer.sanitizeAccountName(
        data.destinationAccount,
      ),
      transactionDate: InputSanitizer.sanitizeLocalDate(data.transactionDate), // Use LocalDate format for backend compatibility
      amount: InputSanitizer.sanitizeAmount(data.amount),
      guidSource: data.guidSource
        ? InputSanitizer.sanitizeGuid(data.guidSource)
        : undefined,
      guidDestination: data.guidDestination
        ? InputSanitizer.sanitizeGuid(data.guidDestination)
        : undefined,
      activeStatus: Boolean(data.activeStatus),
      dateAdded: data.dateAdded
        ? InputSanitizer.sanitizeDate(data.dateAdded)
        : undefined,
      dateUpdated: data.dateUpdated
        ? InputSanitizer.sanitizeDate(data.dateUpdated)
        : undefined,
    };
    console.log("[sanitization.ts] Payment AFTER sanitization:", JSON.stringify(sanitized));
    return sanitized;
  },

  transfer: (data: any) => {
    console.log("[sanitization.ts] Transfer BEFORE sanitization:", JSON.stringify(data));
    const sanitized = {
      transferId: data.transferId ? parseInt(data.transferId) : undefined,
      sourceAccount: InputSanitizer.sanitizeAccountName(data.sourceAccount),
      destinationAccount: InputSanitizer.sanitizeAccountName(
        data.destinationAccount,
      ),
      transactionDate: InputSanitizer.sanitizeLocalDate(data.transactionDate), // Use LocalDate format for backend compatibility
      amount: InputSanitizer.sanitizeAmount(data.amount),
      guidSource: data.guidSource
        ? InputSanitizer.sanitizeGuid(data.guidSource)
        : undefined,
      guidDestination: data.guidDestination
        ? InputSanitizer.sanitizeGuid(data.guidDestination)
        : undefined,
      activeStatus: Boolean(data.activeStatus),
      dateAdded: data.dateAdded
        ? InputSanitizer.sanitizeDate(data.dateAdded)
        : undefined,
      dateUpdated: data.dateUpdated
        ? InputSanitizer.sanitizeDate(data.dateUpdated)
        : undefined,
    };
    console.log("[sanitization.ts] Transfer AFTER sanitization:", JSON.stringify(sanitized));
    return sanitized;
  },

  category: (data: any) => ({
    categoryId: data.categoryId ? parseInt(data.categoryId) : undefined,
    categoryName: InputSanitizer.sanitizeCategory(
      data.categoryName ?? data.category ?? "",
    ),
    activeStatus: Boolean(data.activeStatus),
    dateAdded: data.dateAdded
      ? InputSanitizer.sanitizeDate(data.dateAdded)
      : undefined,
    dateUpdated: data.dateUpdated
      ? InputSanitizer.sanitizeDate(data.dateUpdated)
      : undefined,
  }),

  description: (data: any) => ({
    descriptionId: data.descriptionId
      ? parseInt(data.descriptionId)
      : undefined,
    descriptionName: InputSanitizer.sanitizeCategory(
      data.descriptionName ?? data.description ?? "",
    ),
    activeStatus: Boolean(data.activeStatus ?? true),
    descriptionCount: data.descriptionCount
      ? parseInt(data.descriptionCount)
      : undefined,
    dateAdded: data.dateAdded
      ? InputSanitizer.sanitizeDate(data.dateAdded)
      : undefined,
    dateUpdated: data.dateUpdated
      ? InputSanitizer.sanitizeDate(data.dateUpdated)
      : undefined,
  }),
};

/**
 * Security logging for validation failures
 */
export class SecurityLogger {
  static logSanitizationAttempt(
    field: string,
    originalValue: any,
    sanitizedValue: any,
  ) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`Sanitization applied to field '${field}':`, {
        original:
          typeof originalValue === "string"
            ? originalValue.substring(0, 100)
            : originalValue,
        sanitized:
          typeof sanitizedValue === "string"
            ? sanitizedValue.substring(0, 100)
            : sanitizedValue,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static logValidationFailure(errors: any[], data: any) {
    if (process.env.NODE_ENV === "development") {
      console.error("Validation failed:", {
        errors,
        dataType: typeof data,
        timestamp: new Date().toISOString(),
      });
    }

    // In production, you might want to send this to a security monitoring service
    // This helps detect potential attack attempts
  }
}
