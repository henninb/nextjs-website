import { z } from "zod";

// Financial constants for boundary checks
export const FINANCIAL_LIMITS = {
  MAX_AMOUNT: 999999999.99, // $999 million max
  MIN_AMOUNT: -999999999.99, // Allow negative for debits/refunds
  MAX_DECIMAL_PLACES: 2,
  MAX_STRING_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 1000,
  MAX_NOTES_LENGTH: 2000,
} as const;

// Date validation helpers
const isValidDate = (date: string | Date): boolean => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

// More specific date validation that checks for YYYY-MM-DD format
const isValidYYYYMMDDFormat = (dateString: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateString);
};

const dateString = z
  .string()
  .refine(isValidDate, {
    message:
      "Date must be valid and parseable. Use YYYY-MM-DD format (e.g., 2025-01-15)",
  })
  .or(z.date());

// Strict date validation for LocalDate fields (backend expects YYYY-MM-DD only)
const localDateString = z
  .string()
  .refine(
    (val) => {
      // Check if it has time component (which is invalid for LocalDate)
      if (val.includes("T") || val.includes(":")) {
        return false;
      }
      return isValidYYYYMMDDFormat(val) && isValidDate(val);
    },
    {
      message:
        "Date must be in YYYY-MM-DD format without time (e.g., 2025-01-15). Do not include time component.",
    },
  )
  .or(z.date());

// Common field validations
const accountNameOwner = z
  .string()
  .min(1, "Account name is required")
  .max(
    FINANCIAL_LIMITS.MAX_STRING_LENGTH,
    `Account name cannot exceed ${FINANCIAL_LIMITS.MAX_STRING_LENGTH} characters`,
  )
  .regex(
    /^[a-zA-Z0-9_-]+$/,
    "Account name can only contain letters, numbers, underscores, and hyphens",
  );

const financialAmount = z
  .number()
  .min(
    FINANCIAL_LIMITS.MIN_AMOUNT,
    `Amount cannot be less than $${FINANCIAL_LIMITS.MIN_AMOUNT.toLocaleString()}`,
  )
  .max(
    FINANCIAL_LIMITS.MAX_AMOUNT,
    `Amount cannot exceed $${FINANCIAL_LIMITS.MAX_AMOUNT.toLocaleString()}`,
  )
  .refine(
    (val) => {
      const decimalPlaces = (val.toString().split(".")[1] || "").length;
      return decimalPlaces <= FINANCIAL_LIMITS.MAX_DECIMAL_PLACES;
    },
    {
      message: `Amount must have at most ${FINANCIAL_LIMITS.MAX_DECIMAL_PLACES} decimal places (e.g., 123.45)`,
    },
  );

const description = z
  .string()
  .min(1, "Description is required")
  .max(
    FINANCIAL_LIMITS.MAX_DESCRIPTION_LENGTH,
    `Description cannot exceed ${FINANCIAL_LIMITS.MAX_DESCRIPTION_LENGTH} characters`,
  )
  .trim();

const category = z
  .string()
  .min(1, "Category is required")
  .max(
    FINANCIAL_LIMITS.MAX_STRING_LENGTH,
    `Category name cannot exceed ${FINANCIAL_LIMITS.MAX_STRING_LENGTH} characters`,
  )
  .trim();

const notes = z
  .string()
  .max(
    FINANCIAL_LIMITS.MAX_NOTES_LENGTH,
    `Notes cannot exceed ${FINANCIAL_LIMITS.MAX_NOTES_LENGTH} characters`,
  )
  .optional()
  .default("");

// Enum validations
const accountTypeEnum = z.enum(["credit", "debit"], {
  message: "Account type must be either credit or debit",
});

const transactionStateEnum = z.enum(["cleared", "outstanding", "future"], {
  message: "Transaction state must be cleared, outstanding, or future",
});

const transactionTypeEnum = z
  .enum(["expense", "income", "transfer", "undefined"], {
    message: "Transaction type must be expense, income, transfer, or undefined",
  })
  .optional();

const reoccurringTypeEnum = z.enum(
  [
    "onetime",
    "weekly",
    "fortnightly",
    "monthly",
    "quarterly",
    "bi_annually",
    "annually",
    "undefined",
  ],
  {
    message: "Invalid reoccurring type",
  },
);

// User validation schema
export const UserSchema = z.object({
  userId: z.number().int().positive().optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username cannot exceed 50 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username can only contain letters, numbers, and underscores",
    ),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password cannot exceed 128 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      "Password must contain at least one lowercase letter, uppercase letter, number, and special character",
    ),
  firstName: z
    .string()
    .max(50, "First name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters")
    .optional(),
  lastName: z
    .string()
    .max(50, "Last name cannot exceed 50 characters")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters")
    .optional(),
});

// Account validation schema
export const AccountSchema = z.object({
  accountId: z.number().int().positive().optional(),
  accountNameOwner,
  accountType: accountTypeEnum,
  activeStatus: z.boolean().default(true),
  moniker: z
    .string()
    .min(1, "Moniker is required")
    .max(20, "Moniker cannot exceed 20 characters")
    .regex(/^[a-zA-Z0-9]+$/, "Moniker can only contain letters and numbers"),
  outstanding: financialAmount.default(0),
  future: financialAmount.default(0),
  cleared: financialAmount.default(0),
  dateClosed: dateString.optional(),
  validationDate: dateString.optional(),
  dateAdded: dateString.optional(),
  dateUpdated: dateString.optional(),
});

// Transaction validation schema
export const TransactionSchema = z.object({
  transactionId: z.number().int().positive().optional(),
  guid: z
    .string()
    .uuid("ID must be a valid UUID format (e.g., 123e4567-e89b-12d3-a456-426614174000)")
    .optional(), // Will be generated server-side
  accountId: z.number().int().positive().optional(),
  accountType: accountTypeEnum,
  accountNameOwner,
  transactionDate: dateString,
  description,
  category,
  amount: financialAmount,
  transactionState: transactionStateEnum.default("outstanding"),
  transactionType: transactionTypeEnum,
  activeStatus: z.boolean().default(true),
  reoccurringType: reoccurringTypeEnum.default("onetime"),
  notes,
  dueDate: z.string().optional(),
});

// Payment validation schema
export const PaymentSchema = z.object({
  paymentId: z.number().int().min(0).optional(),
  sourceAccount: accountNameOwner,
  destinationAccount: accountNameOwner,
  transactionDate: localDateString, // Backend expects YYYY-MM-DD format (LocalDate)
  amount: financialAmount,
  guidSource: z
    .string()
    .uuid("Source ID must be a valid UUID format")
    .optional(),
  guidDestination: z
    .string()
    .uuid("Destination ID must be a valid UUID format")
    .optional(),
  activeStatus: z.boolean().default(true),
  dateAdded: dateString.optional(),
  dateUpdated: dateString.optional(),
});

// Transfer validation schema (if needed)
export const TransferSchema = z.object({
  transferId: z.number().int().min(0).optional(),
  sourceAccount: accountNameOwner,
  destinationAccount: accountNameOwner,
  amount: financialAmount,
  transactionDate: localDateString, // Backend expects YYYY-MM-DD format (LocalDate)
  guidSource: z
    .string()
    .uuid("Source ID must be a valid UUID format")
    .optional(),
  guidDestination: z
    .string()
    .uuid("Destination ID must be a valid UUID format")
    .optional(),
  activeStatus: z.boolean().default(true),
  dateAdded: dateString.optional(),
  dateUpdated: dateString.optional(),
});

// Validation result types
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedAccount = z.infer<typeof AccountSchema>;
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;
export type ValidatedPayment = z.infer<typeof PaymentSchema>;
export type ValidatedTransfer = z.infer<typeof TransferSchema>;

// Category validation schema
export const CategorySchema = z.object({
  categoryId: z.number().int().positive().optional(),
  categoryName: z
    .string()
    .min(1, "Category name is required")
    .max(FINANCIAL_LIMITS.MAX_STRING_LENGTH, "Category name too long")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Category name contains invalid characters"),
  activeStatus: z.boolean().default(true),
  dateAdded: dateString.optional(),
  dateUpdated: dateString.optional(),
});

// Description validation schema
export const DescriptionSchema = z.object({
  descriptionId: z.number().int().positive().optional(),
  descriptionName: z
    .string()
    .min(1, "Description name is required")
    .max(FINANCIAL_LIMITS.MAX_STRING_LENGTH, "Description name too long")
    .regex(/^[a-zA-Z0-9 _-]+$/, "Description name contains invalid characters"),
  activeStatus: z.boolean().default(true),
  descriptionCount: z.number().int().optional(),
  dateAdded: dateString.optional(),
  dateUpdated: dateString.optional(),
});

export type ValidatedCategory = z.infer<typeof CategorySchema>;
export type ValidatedDescription = z.infer<typeof DescriptionSchema>;

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Schema validation function
export function validateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
): {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
} {
  try {
    console.log("[schemas.ts] validateSchema INPUT:", JSON.stringify(data));
    const result = schema.safeParse(data);

    if (result.success) {
      console.log("[schemas.ts] validateSchema SUCCESS");
      return {
        success: true,
        data: result.data,
      };
    }

    // Handle ZodError structure (uses 'issues' instead of 'errors')
    const zodError = result.error as any;
    if (zodError && zodError.issues) {
      console.log("[schemas.ts] Zod issues:", JSON.stringify(zodError.issues, null, 2));
      const errors: ValidationError[] = zodError.issues.map((issue: any) => ({
        field: issue.path?.join(".") || "unknown",
        message: issue.message || "Validation failed",
        code: issue.code || "VALIDATION_ERROR",
      }));

      return {
        success: false,
        errors,
      };
    }

    const errors: ValidationError[] = [
      {
        field: "validation",
        message: result.error?.message || "Unknown validation error",
        code: "VALIDATION_ERROR",
      },
    ];

    return {
      success: false,
      errors,
    };
  } catch (error) {
    console.error("[schemas.ts] validateSchema EXCEPTION:", error);
    return {
      success: false,
      errors: [
        {
          field: "validation",
          message: "Schema validation failed",
          code: "VALIDATION_ERROR",
        },
      ],
    };
  }
}
