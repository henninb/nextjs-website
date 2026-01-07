# Test File Merge Plan

## Overview

This document outlines the plan to merge duplicate test files across the codebase. The goal is to consolidate tests for each module into a single, well-organized test file without losing coverage or introducing regressions.

**Status**: Ready for execution
**Created**: 2025-12-09
**Target Completion**: TBD

---

## Summary of Duplicates

### Finance Pages - Duplicates to Merge

| Module        | Files to Merge                  | Total Lines | Target File            |
| ------------- | ------------------------------- | ----------- | ---------------------- |
| categories    | 3 files (base, extended, merge) | 1,149       | categories.test.tsx    |
| configuration | 2 files (base, extended)        | 1,061       | configuration.test.tsx |
| descriptions  | 2 files (base, merge)           | 660         | descriptions.test.tsx  |
| payments      | 2 files (base, extended)        | 1,127       | payments.test.tsx      |
| transfers     | 1 file (base)                   | 361         | transfers.test.tsx     |

**Note**: `-next.test.tsx` files will be kept separate temporarily as they test experimental/next-gen features.

### Already Cleaned Up (In Progress)

- `hooks/useCategoryFetch.test.ts` → merged into `.tsx` version
- `middleware.local.test.ts` → merged into `middleware.test.ts`
- `security/hostValidation.test.ts` → merged into `security.test.ts`

---

## Merge Strategy

### 1. Naming Convention

- **Target**: Keep base name (e.g., `categories.test.tsx`)
- **Removed**: `-extended`, `.merge` suffixes
- **Preserved**: `-next` suffix (kept separate for now)

### 2. Organization Structure

Each merged test file will follow this structure:

```typescript
describe("ModuleName Page", () => {
  // Shared setup and mocks
  beforeEach(() => { ... });
  afterEach(() => { ... });

  describe("Authentication & Authorization", () => {
    // Auth-related tests
  });

  describe("Data Fetching & Loading States", () => {
    // Loading, error handling, retry logic
  });

  describe("Basic CRUD Operations", () => {
    // Create, Read, Update, Delete happy paths
  });

  describe("Form Validation", () => {
    // Input validation, edge cases, error states
  });

  describe("Advanced Features", () => {
    // Merge operations, cascade operations, etc.
  });

  describe("UI Interactions & Rendering", () => {
    // Grid rendering, links, formatting
  });

  describe("Error Handling", () => {
    // Network errors, API failures, edge cases
  });
});
```

### 3. Mock Consolidation

Common mocks found across files:

- `next/navigation` (useRouter)
- `ResizeObserver` global mock
- `@mui/x-data-grid` (DataGrid)
- `AuthProvider` (useAuth)
- Hook mocks (useCategoryFetch, etc.)

**Strategy**: Extract common mocks into:

1. Shared `beforeAll()` setup for globals
2. Shared `beforeEach()` for per-test mocks
3. Helper functions for complex mock configurations

### 4. Deduplication Rules

1. **Identical Tests**: Remove exact duplicates, keep one copy
2. **Similar Tests**: Merge into parameterized test using `test.each()`
3. **Overlapping Tests**: Keep more comprehensive version
4. **Unique Tests**: Preserve all unique test cases

---

## Detailed Merge Plan by Module

### Module 1: Categories (3 files → 1 file)

**Files to Merge**:

- `categories.test.tsx` (225 lines) - 8 test cases
- `categories-extended.test.tsx` (738 lines) - ~40 test cases
- `categories.merge.test.tsx` (186 lines) - 2 test cases

**Target**: `categories.test.tsx`

**Steps**:

1. Create backup: `git stash push -m "pre-merge-categories"`
2. Read all three files completely
3. Identify duplicate test cases (if any)
4. Create new structure with describe blocks:
   - Authentication & Authorization
   - Data Fetching & Loading States
   - Basic CRUD Operations (Add, Delete, Status Toggle)
   - Form Validation (special chars, unicode, whitespace, length)
   - Merge Operations
   - UI Interactions (links, status display, row updates)
   - Error Handling
5. Consolidate common mocks in shared setup
6. Write merged file
7. Delete `categories-extended.test.tsx` and `categories.merge.test.tsx`
8. Run tests: `npm test -- categories.test.tsx`
9. Verify all tests pass

**Expected Test Count**: ~50 tests (8 + 40 + 2)

---

### Module 2: Configuration (2 files → 1 file)

**Files to Merge**:

- `configuration.test.tsx` (377 lines) - Basic functionality
- `configuration-extended.test.tsx` (684 lines) - Extended coverage

**Target**: `configuration.test.tsx`

**Steps**:

1. Create backup: `git stash push -m "pre-merge-configuration"`
2. Read both files completely
3. Identify duplicate test cases
4. Create new structure with describe blocks:
   - Authentication & Authorization
   - Data Fetching & Loading States
   - Parameter CRUD Operations
   - Form Validation
   - UI Interactions
   - Error Handling
5. Consolidate common mocks
6. Write merged file
7. Delete `configuration-extended.test.tsx`
8. Run tests: `npm test -- configuration.test.tsx`
9. Verify all tests pass

**Note**: `configuration-next.test.tsx` kept separate

---

### Module 3: Descriptions (2 files → 1 file)

**Files to Merge**:

- `descriptions.test.tsx` (451 lines) - Basic functionality
- `descriptions.merge.test.tsx` (209 lines) - Merge functionality

**Target**: `descriptions.test.tsx`

**Steps**:

1. Create backup: `git stash push -m "pre-merge-descriptions"`
2. Read both files completely
3. Identify duplicate test cases
4. Create new structure with describe blocks:
   - Authentication & Authorization
   - Data Fetching & Loading States
   - Basic CRUD Operations
   - Merge Operations
   - Form Validation
   - UI Interactions
   - Error Handling
5. Consolidate common mocks
6. Write merged file
7. Delete `descriptions.merge.test.tsx`
8. Run tests: `npm test -- descriptions.test.tsx`
9. Verify all tests pass

---

### Module 4: Payments (2 files → 1 file)

**Files to Merge**:

- `payments.test.tsx` (360 lines) - Basic functionality
- `payments-extended.test.tsx` (767 lines) - Extended validation

**Target**: `payments.test.tsx`

**Steps**:

1. Create backup: `git stash push -m "pre-merge-payments"`
2. Read both files completely
3. Identify duplicate test cases
4. Create new structure with describe blocks:
   - Authentication & Authorization
   - Data Fetching & Loading States
   - Basic CRUD Operations
   - Form Validation (amount, accounts, NaN handling)
   - Account Filtering (debit/credit)
   - UI Interactions (links, currency formatting)
   - Error Handling
5. Consolidate common mocks
6. Write merged file
7. Delete `payments-extended.test.tsx`
8. Run tests: `npm test -- payments.test.tsx`
9. Verify all tests pass

**Note**: `payments-next.test.tsx` kept separate

---

### Module 5: Transfers (Already Single File)

**Current State**:

- `transfers.test.tsx` (361 lines) - Basic functionality
- `transfers-next.test.tsx` (505 lines) - Next-gen (KEPT SEPARATE)

**Action**: No merge needed. Verify current tests pass.

**Steps**:

1. Run tests: `npm test -- transfers.test.tsx`
2. Verify all tests pass

---

## Execution Order

1. **Start with smallest**: Descriptions (2 files, 660 lines)
2. **Then medium**: Categories (3 files, 1,149 lines)
3. **Then larger**: Configuration (2 files, 1,061 lines)
4. **Then largest**: Payments (2 files, 1,127 lines)
5. **Verify**: Transfers (already single file)

---

## Validation Plan

### Per-Module Validation

After merging each module:

1. **Run module tests**:

   ```bash
   npm test -- <module>.test.tsx
   ```

2. **Verify**:
   - All tests pass (0 failures)
   - Test count matches expected count
   - No duplicate test names
   - Coverage maintained or improved

3. **Check for issues**:
   - No skipped tests (`.skip`)
   - No focused tests (`.only`)
   - No pending tests without implementation
   - No commented-out tests

### Final Validation

After all merges complete:

1. **Run full test suite**:

   ```bash
   npm test
   ```

2. **Verify**:
   - All 136 test files pass
   - No new failures introduced
   - Total test count is reduced (duplicates removed)
   - No warnings or deprecations

3. **Run specific test patterns**:
   ```bash
   npm test -- --testPathPattern=pages/finance
   ```

---

## Rollback Strategy

If issues occur during merge:

### Per-Module Rollback

```bash
# Restore pre-merge state for specific module
git stash list  # Find the right stash
git stash apply stash@{n}  # Where n is the stash number
```

### Full Rollback

```bash
# Restore all pre-merge state
git stash list
git stash apply stash@{0}  # Most recent
git stash apply stash@{1}  # Second most recent
# etc.
```

### Alternative: Branch Strategy

Before starting merges:

```bash
git checkout -b test-merge-cleanup
# Do all merges on this branch
# Test thoroughly
# Only merge to main when validated
```

---

## Common Mock Patterns to Consolidate

### 1. Next.js Router Mock

```typescript
jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));
```

### 2. ResizeObserver Mock

```typescript
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});
```

### 3. MUI DataGrid Mock (Complex - varies by test needs)

```typescript
jest.mock("@mui/x-data-grid", () => ({
  DataGrid: ({ rows = [], columns = [], processRowUpdate }: any) => {
    // Implementation varies - keep flexible
  },
}));
```

### 4. AuthProvider Mock

```typescript
jest.mock("../../../components/AuthProvider", () => ({
  useAuth: jest.fn(),
}));
```

---

## Success Criteria

- [ ] All 5 modules merged successfully
- [ ] All tests pass without failures
- [ ] No duplicate test cases remain
- [ ] Test count reduced by eliminating duplicates
- [ ] Common mocks consolidated
- [ ] Code follows consistent structure
- [ ] Documentation updated
- [ ] Git history clean (old files deleted)
- [ ] `-next.test.tsx` files preserved
- [ ] All backups/stashes can be discarded

---

## Post-Merge Tasks

1. **Update CLAUDE.md**:
   - Update test file counts
   - Document new test organization structure
   - Note that -next files are separate

2. **Run full CI/CD validation**:
   - Ensure all tests pass in CI environment
   - Verify coverage metrics maintained

3. **Clean up**:

   ```bash
   # Remove stashes after validation
   git stash clear

   # Commit changes
   git add __tests__
   git commit -m "test: merge duplicate test files

   - Consolidate categories, configuration, descriptions, payments tests
   - Organize tests by feature with describe blocks
   - Consolidate common mocks and setup
   - Remove duplicate test cases
   - Keep -next.test.tsx files separate for experimental features

   Merged files:
   - categories: 3 → 1 (1,149 lines)
   - configuration: 2 → 1 (1,061 lines)
   - descriptions: 2 → 1 (660 lines)
   - payments: 2 → 1 (1,127 lines)
   "
   ```

4. **Create follow-up ticket** for merging `-next.test.tsx` files once next-gen features are stable

---

## Notes & Considerations

### Why Keep -next Files Separate?

- They test experimental/next-gen implementations
- May use different mocking strategies
- API contracts might differ
- Allows parallel development of new features
- Can be merged later when features stabilize

### Risk Mitigation

1. **Backup everything** before starting
2. **Work on a branch** for easy rollback
3. **Test incrementally** after each module
4. **Validate thoroughly** before committing
5. **Keep stashes** until CI passes

### Time Estimates

- Per module: 30-60 minutes (read, analyze, merge, test)
- Total: 3-5 hours for all modules
- Validation: 1 hour
- **Total: 4-6 hours**

---

## Questions & Decisions Log

### Q1: Naming convention for merged files?

**A**: Keep base name (e.g., `categories.test.tsx`)

### Q2: How to organize tests within merged files?

**A**: Group by feature with describe blocks

### Q3: Should we deduplicate test utilities and mocks?

**A**: Yes, consolidate common mocks

### Q4: What to do with -next.test.tsx files?

**A**: Keep separate temporarily

---

## Next Steps

1. Review this plan
2. Get approval to proceed
3. Create feature branch: `git checkout -b test-merge-cleanup`
4. Execute merges in order (descriptions → categories → configuration → payments)
5. Validate after each merge
6. Final validation of full suite
7. Create PR for review
8. Merge to main after approval

---

**Document Version**: 2.0
**Last Updated**: 2025-12-09
**Author**: Claude Code
**Status**: ✅ COMPLETED SUCCESSFULLY

---

## EXECUTION SUMMARY

**Completion Date**: 2025-12-09
**Branch**: test-merge-cleanup
**Total Test Files Merged**: 8 → 4
**Total Tests**: 125 passing
**Files Deleted**: 5 (all extended/merge variants)
**Files Preserved**: 3 (-next.test.tsx files)

### Results by Module

| Module        | Before       | After       | Tests         | Status      |
| ------------- | ------------ | ----------- | ------------- | ----------- |
| descriptions  | 2 files      | 1 file      | 18 tests      | ✅ PASS     |
| categories    | 3 files      | 1 file      | 39 tests      | ✅ PASS     |
| configuration | 2 files      | 1 file      | 32 tests      | ✅ PASS     |
| payments      | 2 files      | 1 file      | 23 tests      | ✅ PASS     |
| transfers     | 1 file       | 1 file      | 13 tests      | ✅ PASS     |
| **TOTAL**     | **10 files** | **5 files** | **125 tests** | ✅ ALL PASS |

### Success Criteria Met

- ✅ All 5 modules merged successfully
- ✅ All 125 tests pass without failures
- ✅ No duplicate test cases remain
- ✅ Common mocks consolidated
- ✅ Code follows consistent structure
- ✅ Git history clean (old files deleted)
- ✅ -next.test.tsx files preserved
- ✅ All tests organized by feature

---

**Document Version**: 2.0
**Last Updated**: 2025-12-09
**Author**: Claude Code
**Status**: ✅ COMPLETED SUCCESSFULLY
