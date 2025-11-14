# Test Fix Requirements - Hooks Normalization

**Date:** 2025-11-13
**Status:** 📋 DOCUMENTED
**Affected Tests:** 337 failed tests across 32 test files

---

## Summary

The hooks normalization migration has introduced breaking changes to the test suite. All migrated hooks (24 hooks across 6 entities) have failing tests due to changes in:

- Validation approach (HookValidator instead of hookValidators)
- Logging approach (structured logging instead of console.log)
- Error handling (FetchError/HookValidationError instead of generic errors)
- HTTP headers (added "Accept" header to all requests)

---

## Test Failure Analysis

### Failed Test Files (32 files)

#### Migrated Hook Tests (24 files)

**Account (4 files):**

- `__tests__/hooks/useAccountFetch.test.tsx`
- `__tests__/hooks/useAccountInsert.isolated.test.ts`
- `__tests__/hooks/useAccountUpdate.isolated.test.ts`
- `__tests__/hooks/useAccountDelete.isolated.test.ts`

**Category (3 files):**

- `__tests__/hooks/useCategoryFetch.test.tsx`
- `__tests__/hooks/useCategoryInsert.isolated.test.ts`
- `__tests__/hooks/useCategoryUpdate.isolated.test.ts`
- `__tests__/hooks/useCategoryDelete.isolated.test.ts`

**Description (3 files):**

- `__tests__/hooks/useDescriptionInsert.isolated.test.ts`
- `__tests__/hooks/useDescriptionUpdate.isolated.test.ts`
- `__tests__/hooks/useDescriptionDelete.isolated.test.ts`

**Parameter (3 files):**

- `__tests__/hooks/useParameterInsert.isolated.test.ts`
- `__tests__/hooks/useParameterUpdate.isolated.test.ts`
- `__tests__/hooks/useParameterDelete.isolated.test.ts`

**Payment (5 files):**

- `__tests__/hooks/usePaymentInsert.isolated.test.ts`
- `__tests__/hooks/usePaymentUpdate.isolated.test.ts`
- `__tests__/hooks/usePaymentDelete.isolated.test.ts`
- `__tests__/hooks/usePaymentCascade.test.tsx`
- `__tests__/hooks/usePaymentCascadeComplete.test.tsx`
- `__tests__/hooks/usePaymentUpdateIntegration.test.tsx`

**Transfer (7 files):**

- `__tests__/hooks/useTransferFetch.modern.test.ts`
- `__tests__/hooks/useTransferInsert.isolated.test.ts`
- `__tests__/hooks/useTransferInsert.modern.test.ts`
- `__tests__/hooks/useTransferUpdate.isolated.test.ts`
- `__tests__/hooks/useTransferUpdate.modern.test.ts`
- `__tests__/hooks/useTransferDelete.isolated.test.ts`
- `__tests__/hooks/useTransferDelete.modern.test.ts`

#### Utility Test Files (5 files)

- `__tests__/utils/fetchUtils.test.ts`
- `__tests__/utils/hookValidation.test.ts`
- `__tests__/utils/logger.test.ts`
- `__tests__/utils/queryConfig.test.ts`
- `__tests__/utils/validation/sanitizationExtensions.test.ts`

---

## Common Failure Patterns

### Pattern 1: Console.log Expectations (OLD → NEW)

**OLD CODE (pre-migration):**

```typescript
console.log("Inserting account for:", accountName);
```

**NEW CODE (post-migration):**

```typescript
log.debug("Inserting account", { accountNameOwner: accountName });
```

**TEST FAILURES:**

```
expect(mockConsole.log).toHaveBeenCalledWith(
  "Inserting account for:",
  "testAccount"
);
// FAILS: Console.log is never called
```

**FIX REQUIRED:**
Remove all console.log expectations. The new structured logging goes through the logger utility which can be tested separately.

**Affected Tests:** ~50+ assertions across isolated tests

---

### Pattern 2: HTTP Headers (OLD → NEW)

**OLD CODE (pre-migration):**

```typescript
headers: {
  "Content-Type": "application/json"
}
```

**NEW CODE (post-migration via fetchWithErrorHandling):**

```typescript
headers: {
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**TEST FAILURES:**

```
expect(global.fetch).toHaveBeenCalledWith(
  "/api/account",
  expect.objectContaining({
    headers: {
      "Content-Type": "application/json"
    }
  })
);
// FAILS: Headers also include "Accept"
```

**FIX REQUIRED:**
Update all header expectations to include both headers:

```typescript
headers: {
  "Content-Type": "application/json",
  "Accept": "application/json"
}
```

**Affected Tests:** ~80+ assertions across isolated tests

---

### Pattern 3: Validation Mock (OLD → NEW)

**OLD MOCK:**

```typescript
jest.mock("../../utils/validation", () => ({
  hookValidators: {
    validateApiPayload: jest.fn(),
  },
}));
```

**NEW CODE:**

```typescript
HookValidator.validateInsert(
  payload,
  DataValidator.validateAccount,
  "insertAccount",
);
```

**TEST FAILURES:**

```
expect(mockValidateApiPayload).toHaveBeenCalledWith(...)
// FAILS: validateApiPayload is never called
```

**FIX REQUIRED:**
Update mocks to include HookValidator:

```typescript
jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((data) => data),
    validateDelete: jest.fn(),
  },
}));
```

**Affected Tests:** ~40+ assertions across isolated tests

---

### Pattern 4: Error Message Format (OLD → NEW)

**OLD CODE (pre-migration):**

```typescript
throw new Error("Account validation failed: Invalid account");
```

**NEW CODE (post-migration):**

```typescript
throw new HookValidationError(
  "insertAccount validation failed: Invalid account",
  validationErrors,
);
```

**TEST FAILURES:**

```
await expect(insertAccount(invalid)).rejects.toThrow(
  "Account validation failed: Invalid account"
);
// FAILS: Message now includes hook name prefix
```

**FIX REQUIRED:**
Update error message expectations:

```typescript
await expect(insertAccount(invalid)).rejects.toThrow(
  "insertAccount validation failed: Invalid account",
);
```

**Affected Tests:** ~60+ assertions across isolated tests

---

### Pattern 5: GUID Validation (Transfer-specific)

**NEW VALIDATION:**
Transfer hooks now validate GUID format for guidSource and guidDestination fields.

**TEST FAILURES:**

```
HookValidationError: insertTransfer validation failed: Invalid GUID format
```

**FIX REQUIRED:**
Ensure test data includes valid GUIDs or null:

```typescript
const mockTransfer = {
  ...data,
  guidSource: "550e8400-e29b-41d4-a716-446655440000", // Valid UUID
  guidDestination: "550e8400-e29b-41d4-a716-446655440001",
};
```

**Affected Tests:** ~20+ Transfer tests

---

### Pattern 6: Date Validation (Payment/Transfer)

**NEW VALIDATION:**
Payment and Transfer hooks validate that transaction dates are not more than 1 year in the past.

**TEST FAILURES:**

```
HookValidationError: updatePayment validation failed:
  Transaction date cannot be more than one year in the past
```

**FIX REQUIRED:**
Use recent dates in test data:

```typescript
const mockPayment = {
  ...data,
  transactionDate: new Date(), // Use current date
};
```

**Affected Tests:** ~15+ Payment/Transfer tests

---

## Fix Strategy

### Phase 1: Update Isolated Tests (Priority 1)

**Files:** 24 isolated test files
**Estimated effort:** 2-3 hours

1. **Remove console.log expectations**
   - Delete all `expect(mockConsole.log).toHaveBeenCalledWith(...)` assertions
   - Logging is tested separately in logger.test.ts

2. **Update header expectations**
   - Change all header matchers to include "Accept"
   - Use `expect.objectContaining()` for flexibility

3. **Update validation mocks**
   - Mock HookValidator instead of hookValidators
   - Ensure mocks return validated data

4. **Update error message expectations**
   - Prefix all error messages with hook name
   - Use HookValidationError and FetchError classes

5. **Fix test data**
   - Add valid GUIDs for Transfer tests
   - Use recent dates for Payment/Transfer tests
   - Ensure all required fields are present

### Phase 2: Update Integration Tests (Priority 2)

**Files:** 3 integration test files (Payment cascade tests)
**Estimated effort:** 1 hour

1. Update cascade tests to work with new logging
2. Update error expectations
3. Verify cache update strategies work correctly

### Phase 3: Update Utility Tests (Priority 3)

**Files:** 5 utility test files
**Estimated effort:** 1 hour

1. Fix timeout test in fetchUtils.test.ts
2. Verify all utility tests pass with new implementations
3. Add any missing coverage for new features

### Phase 4: Update Fetch Tests (Priority 4)

**Files:** 2 fetch test files (useAccountFetch, useCategoryFetch)
**Estimated effort:** 30 minutes

1. Remove console.log expectations
2. Verify authenticated vs public query behavior
3. Test error logging through structured logger

---

## Detailed Fix Examples

### Example 1: useAccountInsert.isolated.test.ts

**BEFORE:**

```typescript
it("should insert account successfully", async () => {
  global.fetch = createFetchMock(responseAccount, { status: 201 });

  const result = await insertAccount(mockAccount);

  expect(result).toEqual(responseAccount);
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/account",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: expect.stringContaining('"activeStatus":true'),
    }),
  );
  expect(mockConsole.log).toHaveBeenCalledWith(
    "Inserting account for:",
    mockAccount.accountNameOwner,
  );
});
```

**AFTER:**

```typescript
it("should insert account successfully", async () => {
  global.fetch = createFetchMock(responseAccount, { status: 201 });

  const result = await insertAccount(mockAccount);

  expect(result).toEqual(responseAccount);
  expect(global.fetch).toHaveBeenCalledWith(
    "/api/account",
    expect.objectContaining({
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: expect.stringContaining('"activeStatus":true'),
    }),
  );
  // Removed console.log expectation - logging tested in logger.test.ts
});
```

### Example 2: useTransferInsert.isolated.test.ts

**BEFORE:**

```typescript
const mockTransfer = {
  transferId: 0,
  sourceAccount: "checking",
  destinationAccount: "savings",
  transactionDate: new Date("2020-01-01"), // Old date
  amount: 100,
  activeStatus: true,
};
```

**AFTER:**

```typescript
const mockTransfer = {
  transferId: 0,
  sourceAccount: "checking",
  destinationAccount: "savings",
  transactionDate: new Date(), // Current date
  amount: 100,
  guidSource: "550e8400-e29b-41d4-a716-446655440000", // Valid GUID
  guidDestination: "550e8400-e29b-41d4-a716-446655440001", // Valid GUID
  activeStatus: true,
};
```

### Example 3: Update Mock Setup

**ADD TO EACH ISOLATED TEST:**

```typescript
// Mock HookValidator
jest.mock("../../utils/hookValidation", () => ({
  HookValidator: {
    validateInsert: jest.fn((data) => data),
    validateUpdate: jest.fn((newData) => newData),
    validateDelete: jest.fn(),
  },
  HookValidationError: class HookValidationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "HookValidationError";
    }
  },
}));

// Mock logger to prevent console output during tests
jest.mock("../../utils/logger", () => ({
  createHookLogger: jest.fn(() => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  })),
}));
```

---

## Success Criteria

- ✅ All 337 failing tests pass
- ✅ No regressions in existing passing tests (2714 tests)
- ✅ Test coverage maintained at current levels
- ✅ All isolated tests properly mock new utilities
- ✅ Integration tests verify cache strategies work
- ✅ Fetch tests verify authenticated vs public queries

---

## Alternative Approach: Delete and Rewrite

Given the extensive changes, an alternative approach would be:

1. **Delete all isolated tests for migrated hooks**
2. **Write new tests** that match the new implementation
3. **Focus on integration tests** for end-to-end behavior
4. **Trust utility tests** for validation, sanitization, logging

This would be faster but lose test history and some edge case coverage.

**Recommendation:** Fix existing tests to preserve coverage and edge cases.

---

## Next Steps

1. ✅ **Document test failures** (this document)
2. ⏳ **Choose fix approach** (fix vs rewrite)
3. ⏳ **Execute fixes** (start with 1-2 files as template)
4. ⏳ **Verify all tests pass**
5. ⏳ **Update progress document**

---

**Last Updated:** 2025-11-13
**Status:** Ready for fix implementation
