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
const isValidDate = (date: string | Date) => {
  const d = new Date(date);
  return d instanceof Date && !isNaN(d.getTime());
};

const dateString = z
  .string()
  .refine(isValidDate, { message: "Invalid date format" })
  .or(z.date());

// Common field validations
const accountNameOwner = z
  .string()
  .min(1, "Account name is required")
  .max(FINANCIAL_LIMITS.MAX_STRING_LENGTH, "Account name too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Account name contains invalid characters");

const financialAmount = z
  .number()
  .min(
    FINANCIAL_LIMITS.MIN_AMOUNT,
    `Amount cannot be less than ${FINANCIAL_LIMITS.MIN_AMOUNT}`,
  )
  .max(
    FINANCIAL_LIMITS.MAX_AMOUNT,
    `Amount cannot exceed ${FINANCIAL_LIMITS.MAX_AMOUNT}`,
  )
  .refine(
    (val) => {
      const decimalPlaces = (val.toString().split(".")[1] || "").length;
      return decimalPlaces <= FINANCIAL_LIMITS.MAX_DECIMAL_PLACES;
    },
    {
      message: `Amount cannot have more than ${FINANCIAL_LIMITS.MAX_DECIMAL_PLACES} decimal places`,
    },
  );

const description = z
  .string()
  .min(1, "Description is required")
  .max(FINANCIAL_LIMITS.MAX_DESCRIPTION_LENGTH, "Description too long")
  .trim();

const category = z
  .string()
  .min(1, "Category is required")
  .max(FINANCIAL_LIMITS.MAX_STRING_LENGTH, "Category name too long")
  .trim();

const notes = z
  .string()
  .max(FINANCIAL_LIMITS.MAX_NOTES_LENGTH, "Notes too long")
  .optional()
  .default("");

// Enum validations
const accountTypeEnum = z.enum(["credit", "debit"], {
  errorMap: () => ({ message: "Account type must be either credit or debit" }),
});

const transactionStateEnum = z.enum(["cleared", "outstanding", "future"], {
  errorMap: () => ({
    message: "Transaction state must be cleared, outstanding, or future",
  }),
});

const transactionTypeEnum = z.enum(["debit", "credit"], {
  errorMap: () => ({ message: "Transaction type must be debit or credit" }),
});

const reoccurringTypeEnum = z.enum(["onetime", "monthly", "weekly", "yearly"], {
  errorMap: () => ({ message: "Invalid reoccurring type" }),
});

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
  guid: z.string().uuid("Invalid GUID format").optional(), // Will be generated server-side
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
  paymentId: z.number().int().positive(),
  accountNameOwner,
  sourceAccount: accountNameOwner,
  destinationAccount: accountNameOwner,
  transactionDate: dateString,
  amount: financialAmount,
  activeStatus: z.boolean().default(true),
  dateAdded: dateString.optional(),
  dateUpdated: dateString.optional(),
});

// Transfer validation schema (if needed)
export const TransferSchema = z.object({
  transferId: z.number().int().positive().optional(),
  sourceAccount: accountNameOwner,
  destinationAccount: accountNameOwner,
  amount: financialAmount,
  transferDate: dateString,
  description,
  activeStatus: z.boolean().default(true),
});

// Validation result types
export type ValidatedUser = z.infer<typeof UserSchema>;
export type ValidatedAccount = z.infer<typeof AccountSchema>;
export type ValidatedTransaction = z.infer<typeof TransactionSchema>;
export type ValidatedPayment = z.infer<typeof PaymentSchema>;
export type ValidatedTransfer = z.infer<typeof TransferSchema>;

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
    const result = schema.safeParse(data);

    if (result.success) {
      return {
        success: true,
        data: result.data,
      };
    }

    const errors: ValidationError[] = result.error.errors.map((err) => ({
      field: err.path.join("."),
      message: err.message,
      code: err.code,
    }));

    return {
      success: false,
      errors,
    };
  } catch (error) {
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
