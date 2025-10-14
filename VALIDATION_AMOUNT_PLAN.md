# Validation Amount Page Implementation Plan

## Overview

Add a new CRUD page for managing validation amounts in the finance section with account-based filtering.

## Requirements Summary

- Create missing CRUD hooks (Update and Delete)
- Account selector for filtering (similar to transactions page)
- Show all transaction states in one grid
- Inline editing for: validationDate, amount, transactionState, activeStatus
- No summary bar needed

## Implementation Steps

### 1. Create Missing Hooks

#### 1.1 Create `useValidationAmountUpdate` Hook

- **Location**: `hooks/useValidationAmountUpdate.ts`
- **Functionality**:
  - Use `useMutation` from React Query
  - PUT/PATCH endpoint: `/api/validation/amount`
  - Accept old and new ValidationAmount objects
  - Invalidate/update query cache on success
  - Error handling with proper logging

#### 1.2 Create `useValidationAmountDelete` Hook

- **Location**: `hooks/useValidationAmountDelete.ts`
- **Functionality**:
  - Use `useMutation` from React Query
  - DELETE endpoint: `/api/validation/amount/{validationId}`
  - Accept ValidationAmount object to delete
  - Invalidate query cache on success
  - Error handling with proper logging

### 2. Update Fetch Hook (if needed)

- **Review**: `hooks/useValidationAmountFetch.ts`
- **Changes**:
  - Currently fetches only "cleared" state
  - Update to fetch ALL transaction states for a given account
  - Or create separate fetch all endpoint if backend supports it

### 3. Create Validation Amount Page

#### 3.1 Page Component

- **Location**: `pages/finance/validation-amounts.tsx`
- **Style**: Follow categories.tsx pattern with inline editing
- **Key Features**:
  - Account selector dropdown (similar to transactions/[accountNameOwner].tsx)
  - DataGridBase component with inline editing
  - Add, Edit (inline), Delete operations
  - Loading, Error, and Empty states
  - Authentication check

#### 3.2 Grid Columns Configuration

```typescript
columns: [
  - validationId (read-only, hidden or minimal width)
  - validationDate (editable, date picker)
  - accountId (read-only, display account name)
  - amount (editable, number input with currency format)
  - transactionState (editable, dropdown: cleared/outstanding/pending/future)
  - activeStatus (editable, switch/checkbox)
  - dateAdded (read-only, formatted date)
  - dateUpdated (read-only, formatted date)
  - Actions column (Delete button)
]
```

#### 3.3 Features

- **Add New**: FormDialog with fields for all editable properties
- **Inline Edit**: Process row update for date, amount, state, status
- **Delete**: ConfirmDialog before deletion
- **Account Filter**: Dropdown to select account (required)
- **Snackbar**: Success/error messages
- **Empty State**: When no validation amounts exist for selected account

### 4. Add to Finance Menu

#### 4.1 Update Layout Navigation

- **Location**: `components/Layout.tsx`
- **Changes**:
  - Add to `financeLinks` array:
    ```typescript
    {
      text: "Validation Amounts",
      href: "/finance/validation-amounts",
      icon: <VerifiedIcon /> // or appropriate icon
    }
    ```
  - Position: After "Medical Expenses" or logical grouping

### 5. Write Tests

#### 5.1 Hook Tests

- `__tests__/hooks/useValidationAmountUpdate.isolated.test.ts`
  - Test successful update
  - Test error handling
  - Test cache invalidation

- `__tests__/hooks/useValidationAmountDelete.isolated.test.ts`
  - Test successful delete
  - Test error handling
  - Test cache invalidation

#### 5.2 Page Tests

- `__tests__/pages/finance/validation-amounts.test.tsx`
  - Render with account selector
  - Display validation amounts in grid
  - Add new validation amount
  - Update validation amount (inline edit)
  - Delete validation amount
  - Handle empty state
  - Handle error state
  - Handle loading state
  - Authentication redirect

## Technical Considerations

### API Endpoints (Assumptions)

- GET: `/api/validation/amount/select/{accountNameOwner}` - fetch all states
- POST: `/api/validation/amount` - create new
- PUT/PATCH: `/api/validation/amount` - update existing
- DELETE: `/api/validation/amount/{validationId}` - delete

### Transaction State Options

- cleared
- outstanding
- pending
- future
- undefined (fallback)

### Validation Rules

- validationDate: Required, valid date
- amount: Required, numeric, can be negative or positive
- transactionState: Required, valid enum value
- activeStatus: Required, boolean
- accountId: Required when creating/updating

## UI/UX Flow

1. User navigates to Finance → Validation Amounts
2. Page shows account selector dropdown (required)
3. User selects an account
4. Grid loads validation amounts for that account (all states)
5. User can:
   - Click "Add Validation Amount" → Opens form dialog
   - Click on editable cells → Inline edit mode
   - Click Delete icon → Confirmation dialog
6. All changes trigger snackbar notifications
7. Grid auto-refreshes after mutations

## Dependencies

- Existing: @mui/x-data-grid, @tanstack/react-query, MUI components
- Reuse: DataGridBase, FormDialog, ConfirmDialog, PageHeader, ErrorDisplay, EmptyState, LoadingState
- Icons: Need to select appropriate icon for menu (VerifiedIcon, CheckCircleIcon, or similar)

## Success Criteria

- [ ] useValidationAmountUpdate hook created and tested
- [ ] useValidationAmountDelete hook created and tested
- [ ] Validation amounts page renders with account selector
- [ ] All CRUD operations work correctly
- [ ] Inline editing functions for all editable fields
- [ ] Menu item added and navigation works
- [ ] All tests pass
- [ ] Error handling and loading states work
- [ ] Authentication protection in place
