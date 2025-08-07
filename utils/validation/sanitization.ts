import DOMPurify from 'dompurify';
import validator from 'validator';

// Configure DOMPurify for server-side usage (if running in Node.js)
let purify: typeof DOMPurify;

if (typeof window === 'undefined') {
  // Server-side - use a simpler approach for now
  purify = {
    sanitize: (input: string, config?: any) => {
      // Basic server-side sanitization without JSDOM dependency
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<[^>]*>/g, '')
        .trim();
    }
  } as any;
} else {
  // Client-side
  purify = DOMPurify;
}

/**
 * Sanitization utilities for preventing XSS and injection attacks
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content - removes all potentially dangerous HTML
   */
  static sanitizeHtml(input: string): string {
    if (typeof input !== 'string') return '';
    
    return purify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML tags allowed
      ALLOWED_ATTR: [],
      KEEP_CONTENT: true, // Keep text content, remove tags
    });
  }

  /**
   * Sanitize text input - basic text cleaning
   */
  static sanitizeText(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
      .replace(/\s+/g, ' '); // Normalize whitespace
  }

  /**
   * Sanitize financial amount - ensures proper number format
   */
  static sanitizeAmount(input: number | string): number {
    if (typeof input === 'number') {
      return Math.round(input * 100) / 100; // Round to 2 decimal places
    }
    
    if (typeof input === 'string') {
      // Remove all non-numeric characters except decimal point and minus sign
      const cleaned = input.replace(/[^-0-9.]/g, '');
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
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[^a-zA-Z0-9_-]/g, '') // Only allow alphanumeric, underscore, hyphen
      .toLowerCase()
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize description - allows safe characters for descriptions
   */
  static sanitizeDescription(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Allow alphanumeric, spaces, and common punctuation
    const sanitized = input
      .replace(/[<>\"'&]/g, '') // Remove dangerous HTML characters
      .replace(/[^\w\s\-.,!?()[\]{}:;]/g, '') // Only allow safe characters
      .trim()
      .substring(0, 1000); // Limit length
    
    return this.sanitizeHtml(sanitized);
  }

  /**
   * Sanitize category name
   */
  static sanitizeCategory(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[^a-zA-Z0-9\s_-]/g, '') // Only allow safe characters
      .replace(/\s+/g, ' ') // Normalize spaces
      .substring(0, 255); // Limit length
  }

  /**
   * Sanitize notes field - more permissive than description but still safe
   */
  static sanitizeNotes(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Allow more characters for notes but still prevent XSS
    const sanitized = input
      .replace(/[<>]/g, '') // Remove angle brackets
      .trim()
      .substring(0, 2000); // Limit length
    
    return this.sanitizeHtml(sanitized);
  }

  /**
   * Validate and sanitize email
   */
  static sanitizeEmail(input: string): string {
    if (typeof input !== 'string') return '';
    
    const trimmed = input.trim().toLowerCase();
    
    if (!validator.isEmail(trimmed)) {
      throw new Error('Invalid email format');
    }
    
    return validator.normalizeEmail(trimmed) || trimmed;
  }

  /**
   * Sanitize username
   */
  static sanitizeUsername(input: string): string {
    if (typeof input !== 'string') return '';
    
    return input
      .trim()
      .replace(/[^a-zA-Z0-9_]/g, '') // Only alphanumeric and underscore
      .toLowerCase()
      .substring(0, 50); // Limit length
  }

  /**
   * Sanitize password - minimal sanitization to preserve intended password
   */
  static sanitizePassword(input: string): string {
    if (typeof input !== 'string') return '';
    
    // Only remove null bytes and control characters
    return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  }

  /**
   * Sanitize date string
   */
  static sanitizeDate(input: string | Date): string {
    if (input instanceof Date) {
      return input.toISOString();
    }
    
    if (typeof input !== 'string') return '';
    
    // Remove any non-date characters and validate
    const cleaned = input.replace(/[^0-9T:.-]/g, '');
    const date = new Date(cleaned);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date format');
    }
    
    return date.toISOString();
  }

  /**
   * Sanitize GUID/UUID
   */
  static sanitizeGuid(input: string): string {
    if (typeof input !== 'string') return '';
    
    const cleaned = input.replace(/[^a-fA-F0-9-]/g, '');
    
    if (!validator.isUUID(cleaned)) {
      throw new Error('Invalid GUID format');
    }
    
    return cleaned.toLowerCase();
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
    firstName: data.firstName ? InputSanitizer.sanitizeText(data.firstName) : undefined,
    lastName: data.lastName ? InputSanitizer.sanitizeText(data.lastName) : undefined,
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
    dateClosed: data.dateClosed ? InputSanitizer.sanitizeDate(data.dateClosed) : undefined,
    validationDate: data.validationDate ? InputSanitizer.sanitizeDate(data.validationDate) : undefined,
    dateAdded: data.dateAdded ? InputSanitizer.sanitizeDate(data.dateAdded) : undefined,
    dateUpdated: data.dateUpdated ? InputSanitizer.sanitizeDate(data.dateUpdated) : undefined,
  }),

  transaction: (data: any) => ({
    transactionId: data.transactionId ? parseInt(data.transactionId) : undefined,
    guid: data.guid ? InputSanitizer.sanitizeGuid(data.guid) : undefined,
    accountId: data.accountId ? parseInt(data.accountId) : undefined,
    accountType: InputSanitizer.sanitizeText(data.accountType),
    accountNameOwner: InputSanitizer.sanitizeAccountName(data.accountNameOwner),
    transactionDate: InputSanitizer.sanitizeDate(data.transactionDate),
    description: InputSanitizer.sanitizeDescription(data.description),
    category: InputSanitizer.sanitizeCategory(data.category),
    amount: InputSanitizer.sanitizeAmount(data.amount),
    transactionState: InputSanitizer.sanitizeText(data.transactionState),
    transactionType: InputSanitizer.sanitizeText(data.transactionType),
    activeStatus: Boolean(data.activeStatus),
    reoccurringType: InputSanitizer.sanitizeText(data.reoccurringType),
    notes: InputSanitizer.sanitizeNotes(data.notes || ''),
    dueDate: data.dueDate ? InputSanitizer.sanitizeDate(data.dueDate) : undefined,
  }),

  payment: (data: any) => ({
    paymentId: parseInt(data.paymentId),
    accountNameOwner: InputSanitizer.sanitizeAccountName(data.accountNameOwner),
    sourceAccount: InputSanitizer.sanitizeAccountName(data.sourceAccount),
    destinationAccount: InputSanitizer.sanitizeAccountName(data.destinationAccount),
    transactionDate: InputSanitizer.sanitizeDate(data.transactionDate),
    amount: InputSanitizer.sanitizeAmount(data.amount),
    activeStatus: Boolean(data.activeStatus),
    dateAdded: data.dateAdded ? InputSanitizer.sanitizeDate(data.dateAdded) : undefined,
    dateUpdated: data.dateUpdated ? InputSanitizer.sanitizeDate(data.dateUpdated) : undefined,
  }),
};

/**
 * Security logging for validation failures
 */
export class SecurityLogger {
  static logSanitizationAttempt(field: string, originalValue: any, sanitizedValue: any) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(`Sanitization applied to field '${field}':`, {
        original: typeof originalValue === 'string' ? originalValue.substring(0, 100) : originalValue,
        sanitized: typeof sanitizedValue === 'string' ? sanitizedValue.substring(0, 100) : sanitizedValue,
        timestamp: new Date().toISOString(),
      });
    }
  }

  static logValidationFailure(errors: any[], data: any) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Validation failed:', {
        errors,
        dataType: typeof data,
        timestamp: new Date().toISOString(),
      });
    }
    
    // In production, you might want to send this to a security monitoring service
    // This helps detect potential attack attempts
  }
}