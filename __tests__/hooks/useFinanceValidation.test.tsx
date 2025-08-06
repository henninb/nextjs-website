import { renderHook } from "@testing-library/react";

const useFinanceValidation = () => {
  const validateAmount = (amount: string | number): { isValid: boolean; error?: string } => {
    if (amount === "" || amount === null || amount === undefined) {
      return { isValid: false, error: "Amount is required" };
    }

    const numericAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) {
      return { isValid: false, error: "Amount must be a valid number" };
    }

    if (!isFinite(numericAmount)) {
      return { isValid: false, error: "Amount must be finite" };
    }

    if (Math.abs(numericAmount) > 999999.99) {
      return { isValid: false, error: "Amount cannot exceed $999,999.99" };
    }

    const decimalPlaces = amount.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      return { isValid: false, error: "Amount cannot have more than 2 decimal places" };
    }

    return { isValid: true };
  };

  const validateCategory = (category: string): { isValid: boolean; error?: string } => {
    if (!category || category.trim() === "") {
      return { isValid: false, error: "Category is required" };
    }

    if (category.length > 50) {
      return { isValid: false, error: "Category name cannot exceed 50 characters" };
    }

    const validCategoryPattern = /^[a-zA-Z0-9\s\-_&()]+$/;
    if (!validCategoryPattern.test(category)) {
      return { isValid: false, error: "Category contains invalid characters" };
    }

    return { isValid: true };
  };

  const validateDescription = (description: string): { isValid: boolean; error?: string } => {
    if (!description || description.trim() === "") {
      return { isValid: false, error: "Description is required" };
    }

    if (description.length > 200) {
      return { isValid: false, error: "Description cannot exceed 200 characters" };
    }

    const validDescriptionPattern = /^[a-zA-Z0-9\s\-_&().,!?@#$%^*+=<>[\]{}|;:'"]+$/;
    if (!validDescriptionPattern.test(description)) {
      return { isValid: false, error: "Description contains invalid characters" };
    }

    return { isValid: true };
  };

  const validateAccountName = (accountName: string): { isValid: boolean; error?: string } => {
    if (!accountName || accountName.trim() === "") {
      return { isValid: false, error: "Account name is required" };
    }

    if (accountName.length > 100) {
      return { isValid: false, error: "Account name cannot exceed 100 characters" };
    }

    const validAccountPattern = /^[a-zA-Z0-9\s\-_&()]+$/;
    if (!validAccountPattern.test(accountName)) {
      return { isValid: false, error: "Account name contains invalid characters" };
    }

    return { isValid: true };
  };

  const validateDate = (date: string): { isValid: boolean; error?: string } => {
    if (!date || date.trim() === "") {
      return { isValid: false, error: "Date is required" };
    }

    const dateObject = new Date(date);
    if (isNaN(dateObject.getTime())) {
      return { isValid: false, error: "Invalid date format" };
    }

    const now = new Date();
    const hundredYearsAgo = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
    const oneYearFromNow = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());

    if (dateObject < hundredYearsAgo) {
      return { isValid: false, error: "Date cannot be more than 100 years ago" };
    }

    if (dateObject > oneYearFromNow) {
      return { isValid: false, error: "Date cannot be more than 1 year in the future" };
    }

    return { isValid: true };
  };

  const validateTransaction = (transaction: {
    amount: string | number;
    category: string;
    description: string;
    accountNameOwner: string;
    transactionDate: string;
  }): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {};

    const amountValidation = validateAmount(transaction.amount);
    if (!amountValidation.isValid) {
      errors.amount = amountValidation.error!;
    }

    const categoryValidation = validateCategory(transaction.category);
    if (!categoryValidation.isValid) {
      errors.category = categoryValidation.error!;
    }

    const descriptionValidation = validateDescription(transaction.description);
    if (!descriptionValidation.isValid) {
      errors.description = descriptionValidation.error!;
    }

    const accountValidation = validateAccountName(transaction.accountNameOwner);
    if (!accountValidation.isValid) {
      errors.accountNameOwner = accountValidation.error!;
    }

    const dateValidation = validateDate(transaction.transactionDate);
    if (!dateValidation.isValid) {
      errors.transactionDate = dateValidation.error!;
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    };
  };

  return {
    validateAmount,
    validateCategory,
    validateDescription,
    validateAccountName,
    validateDate,
    validateTransaction,
  };
};

describe("useFinanceValidation Hook", () => {
  describe("Amount Validation", () => {
    it("validates valid amounts", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateAmount(100)).toEqual({ isValid: true });
      expect(result.current.validateAmount("100")).toEqual({ isValid: true });
      expect(result.current.validateAmount(100.50)).toEqual({ isValid: true });
      expect(result.current.validateAmount("100.50")).toEqual({ isValid: true });
      expect(result.current.validateAmount(-100)).toEqual({ isValid: true });
      expect(result.current.validateAmount(0)).toEqual({ isValid: true });
    });

    it("rejects invalid amounts", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateAmount("")).toEqual({ 
        isValid: false, 
        error: "Amount is required" 
      });
      
      expect(result.current.validateAmount("abc")).toEqual({ 
        isValid: false, 
        error: "Amount must be a valid number" 
      });
      
      expect(result.current.validateAmount(Infinity)).toEqual({ 
        isValid: false, 
        error: "Amount must be finite" 
      });
      
      expect(result.current.validateAmount(1000000)).toEqual({ 
        isValid: false, 
        error: "Amount cannot exceed $999,999.99" 
      });
      
      expect(result.current.validateAmount("100.123")).toEqual({ 
        isValid: false, 
        error: "Amount cannot have more than 2 decimal places" 
      });
    });
  });

  describe("Category Validation", () => {
    it("validates valid categories", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateCategory("Food")).toEqual({ isValid: true });
      expect(result.current.validateCategory("Transportation")).toEqual({ isValid: true });
      expect(result.current.validateCategory("Food & Dining")).toEqual({ isValid: true });
      expect(result.current.validateCategory("Gas-Station")).toEqual({ isValid: true });
      expect(result.current.validateCategory("ATM (Withdrawal)")).toEqual({ isValid: true });
    });

    it("rejects invalid categories", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateCategory("")).toEqual({ 
        isValid: false, 
        error: "Category is required" 
      });
      
      expect(result.current.validateCategory("a".repeat(51))).toEqual({ 
        isValid: false, 
        error: "Category name cannot exceed 50 characters" 
      });
      
      expect(result.current.validateCategory("Food@#$%")).toEqual({ 
        isValid: false, 
        error: "Category contains invalid characters" 
      });
    });
  });

  describe("Description Validation", () => {
    it("validates valid descriptions", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateDescription("Grocery shopping")).toEqual({ isValid: true });
      expect(result.current.validateDescription("ATM withdrawal at Bank")).toEqual({ isValid: true });
      expect(result.current.validateDescription("Payment for services @company")).toEqual({ isValid: true });
    });

    it("rejects invalid descriptions", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateDescription("")).toEqual({ 
        isValid: false, 
        error: "Description is required" 
      });
      
      expect(result.current.validateDescription("a".repeat(201))).toEqual({ 
        isValid: false, 
        error: "Description cannot exceed 200 characters" 
      });
    });
  });

  describe("Account Name Validation", () => {
    it("validates valid account names", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateAccountName("Chase Checking")).toEqual({ isValid: true });
      expect(result.current.validateAccountName("Savings-Account_1")).toEqual({ isValid: true });
      expect(result.current.validateAccountName("Credit Card (Main)")).toEqual({ isValid: true });
    });

    it("rejects invalid account names", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateAccountName("")).toEqual({ 
        isValid: false, 
        error: "Account name is required" 
      });
      
      expect(result.current.validateAccountName("a".repeat(101))).toEqual({ 
        isValid: false, 
        error: "Account name cannot exceed 100 characters" 
      });
      
      expect(result.current.validateAccountName("Account@#$")).toEqual({ 
        isValid: false, 
        error: "Account name contains invalid characters" 
      });
    });
  });

  describe("Date Validation", () => {
    it("validates valid dates", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateDate("2024-01-01")).toEqual({ isValid: true });
      expect(result.current.validateDate("2023-12-31")).toEqual({ isValid: true });
      
      const today = new Date().toISOString().split('T')[0];
      expect(result.current.validateDate(today)).toEqual({ isValid: true });
    });

    it("rejects invalid dates", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateDate("")).toEqual({ 
        isValid: false, 
        error: "Date is required" 
      });
      
      expect(result.current.validateDate("invalid-date")).toEqual({ 
        isValid: false, 
        error: "Invalid date format" 
      });
      
      expect(result.current.validateDate("1900-01-01")).toEqual({ 
        isValid: false, 
        error: "Date cannot be more than 100 years ago" 
      });
      
      expect(result.current.validateDate("2030-01-01")).toEqual({ 
        isValid: false, 
        error: "Date cannot be more than 1 year in the future" 
      });
    });
  });

  describe("Transaction Validation", () => {
    it("validates complete valid transaction", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      const validTransaction = {
        amount: 100.50,
        category: "Food",
        description: "Grocery shopping",
        accountNameOwner: "Chase Checking",
        transactionDate: "2024-01-01",
      };
      
      expect(result.current.validateTransaction(validTransaction)).toEqual({ 
        isValid: true, 
        errors: {} 
      });
    });

    it("collects all validation errors", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      const invalidTransaction = {
        amount: "",
        category: "",
        description: "",
        accountNameOwner: "",
        transactionDate: "",
      };
      
      const validation = result.current.validateTransaction(invalidTransaction);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual({
        amount: "Amount is required",
        category: "Category is required",
        description: "Description is required",
        accountNameOwner: "Account name is required",
        transactionDate: "Date is required",
      });
    });

    it("validates partial errors correctly", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      const partiallyInvalidTransaction = {
        amount: 100.50,
        category: "Food@#$",
        description: "Valid description",
        accountNameOwner: "Chase Checking",
        transactionDate: "2024-01-01",
      };
      
      const validation = result.current.validateTransaction(partiallyInvalidTransaction);
      
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toEqual({
        category: "Category contains invalid characters",
      });
    });
  });

  describe("Edge Cases", () => {
    it("handles null and undefined inputs", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateAmount(null as any)).toEqual({ 
        isValid: false, 
        error: "Amount is required" 
      });
      
      expect(result.current.validateAmount(undefined as any)).toEqual({ 
        isValid: false, 
        error: "Amount is required" 
      });
    });

    it("handles whitespace-only inputs", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateCategory("   ")).toEqual({ 
        isValid: false, 
        error: "Category is required" 
      });
      
      expect(result.current.validateDescription("   ")).toEqual({ 
        isValid: false, 
        error: "Description is required" 
      });
    });

    it("handles very large and very small numbers", () => {
      const { result } = renderHook(() => useFinanceValidation());
      
      expect(result.current.validateAmount(0.01)).toEqual({ isValid: true });
      expect(result.current.validateAmount(-0.01)).toEqual({ isValid: true });
      expect(result.current.validateAmount(999999.99)).toEqual({ isValid: true });
      expect(result.current.validateAmount(-999999.99)).toEqual({ isValid: true });
    });
  });
});