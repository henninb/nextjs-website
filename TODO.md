## 1. Test Passing

**Role:** Expert Jest tester

**Instructions:**

- Achieve **100% test coverage** for all tests.
- If a functionality change seems necessary, **prompt me first** before implementing.
- Follow consistent patterns and industry best practices for Jest tests.
- Ensure tests are **clear**, **maintainable**, and **easy to read**.

## 2. Error Handling Improvements

**Analysis completed:** Error handling patterns reviewed across the NextJS TypeScript application.

### Current State:

- Good validation and sanitization in place with comprehensive schemas
- React Query for data fetching with basic error handling
- Try-catch blocks in hooks and API routes
- Console logging for errors
- CSP violation reporting system

### Critical Missing Components:

#### 2.1 Error Boundaries

- **Missing:** React Error Boundaries to catch component-level errors
- **Risk:** Unhandled component errors cause entire app crashes
- **Recommendation:** Implement ErrorBoundary component in `components/ErrorBoundary.tsx`
- **Priority:** HIGH

#### 2.2 Global Error Handler

- **Missing:** Centralized error handling and reporting
- **Current:** Scattered console.log statements
- **Recommendation:** Implement unified error service with severity levels
- **Priority:** HIGH

#### 2.3 User-Facing Error States

- **Missing:** Consistent error UI components
- **Current:** Basic error messages in hooks
- **Recommendation:** Standardized error display components
- **Priority:** MEDIUM

#### 2.4 Network Error Recovery

- **Missing:** Retry strategies and offline detection
- **Current:** Basic React Query retry (1x)
- **Recommendation:** Exponential backoff, network status detection
- **Priority:** MEDIUM

#### 2.5 API Error Handling Improvements

- **Issue:** Inconsistent error response formats
- **Current:** Mix of status codes and error objects
- **Recommendation:** Standardize API error responses
- **Priority:** MEDIUM

#### 2.6 Logging and Monitoring

- **Missing:** Structured error logging for production
- **Current:** Development console.log only
- **Recommendation:** Implement error tracking service integration
- **Priority:** MEDIUM

#### 2.7 Form Validation Error Display

- **Issue:** Limited user feedback for validation errors
- **Current:** Basic error messages
- **Recommendation:** Enhanced form error states with field-level feedback
- **Priority:** LOW

#### 2.8 Security Error Handling

- **Good:** CSP violation reporting exists
- **Missing:** Authentication/authorization error handling
- **Recommendation:** Standardize auth error flows
- **Priority:** MEDIUM

### Specific Implementation Recommendations:

1. **Create ErrorBoundary component** - Wrap \_app.tsx and critical sections
2. **Implement ErrorService class** - Centralized error handling with categorization
3. **Add ErrorDisplay components** - Reusable error UI components
4. **Enhance React Query configuration** - Better retry strategies and error handling
5. **Standardize API error responses** - Consistent error format across all endpoints
6. **Add error tracking integration** - Sentry or similar for production monitoring
7. **Implement network status detection** - Handle offline scenarios
8. **Add loading states with error fallbacks** - Better UX during error states

## 3. Account Balance Reconciliation Issue - centerpoint_brian (Resolved: Aug 2025)

### Problem Description

The centerpoint_brian utility account was showing a negative balance of -$6,230.99 instead of balancing to zero. This occurred because payments were being recorded without corresponding bill/expense transactions, causing the account to appear as if payments were being made for non-existent bills.

### Root Cause Analysis

- Each payment created a negative transaction entry but no corresponding positive expense entry
- This violated double-entry accounting principles where utility payments should have matching bill expenses
- The account appeared to be "overpaying" by the total amount of unmatched payments
- Issue existed across multiple years (2023-2025)

### Data Analysis Results

**2025 Data:**

- 9 payments totaling $893.27 missing corresponding bills ($860.06 after excluding $0 entry)
- Transaction entries: 17 total, balanced to $0.00 after fix

**2024 Data:**

- 14 payments totaling $861.14 missing corresponding bills
- Transaction entries: 28 total, balanced to $0.00 after fix

**2023 Data:**

- 17 payments with 6 suspicious $1.00 entries (likely test data) and 11 legitimate payments totaling $896.34
- Transaction entries: 22 total, balanced to $0.00 after fix

### Solution Implementation

#### Phase 1: 2025 Fix

- Created 8 matching "centerpoint energy" expense transactions for legitimate payments
- All transactions properly categorized as 'utilities' with 'expense' type
- Used account_id 1059 for centerpoint_brian account

#### Phase 2: 2024 Fix

- Created 14 matching "centerpoint energy" expense transactions for all payments
- Applied same categorization and account structure as 2025

#### Phase 3: 2023 Cleanup

- **Data Cleaning**: Deactivated 6 suspicious $1.00 payments (appeared to be test entries)
- **Bill Generation**: Created 7 new expense transactions for orphaned legitimate payments
- **Deduplication**: Preserved 4 existing bills that already matched payments, removed 4 duplicate generated bills

### Final Results

- **Total Data Fixed**: $2,650.75 in missing bill entries across three years
- **Data Cleaned**: $6.00 in suspicious test payments removed
- **All Years Balanced**: 2023, 2024, and 2025 now show $0.00 transaction totals
- **Accounting Integrity**: Proper double-entry accounting restored

### Technical Implementation Details

```sql
-- Example of bill generation for payments
INSERT INTO t_transaction (
    guid, account_id, account_type, account_name_owner,
    transaction_date, amount, description, category,
    transaction_type, transaction_state, active_status,
    reoccurring_type, notes
)
SELECT
    gen_random_uuid()::text, 1059, 'credit', 'centerpoint_brian',
    transaction_date, ABS(amount), 'centerpoint energy', 'utilities',
    'expense', 'cleared', true, 'onetime',
    'auto-generated bill for payment balancing'
FROM t_transaction
WHERE account_name_owner = 'centerpoint_brian'
AND active_status = true
AND EXTRACT(YEAR FROM transaction_date) = [YEAR]
AND amount < 0;
```

### Prevention Recommendations

1. **Automatic Bill Generation**: Implement code in `usePaymentInsert.ts` to auto-generate matching transactions when payments are made to utility accounts
2. **Account Type Parameters**: Add configuration to identify accounts requiring automatic expense creation
3. **Validation Rules**: Add database constraints to prevent payment-only entries for utility accounts
4. **Monitoring**: Implement balance monitoring to detect similar issues early

### Code Changes Suggested

```typescript
// In usePaymentInsert.ts - after payment insertion
const utilityAccounts = ["centerpoint_brian", "att_brian", "water_bill_brian"];

if (utilityAccounts.includes(newData.destinationAccount)) {
  const billTransaction = {
    accountNameOwner: newData.destinationAccount,
    transactionDate: newData.transactionDate,
    amount: newData.amount,
    description: `${newData.destinationAccount.replace("_", " ").toUpperCase()} Bill`,
    category: "utilities",
    transactionType: "expense" as TransactionType,
    transactionState: "cleared",
    notes: "Auto-generated from payment",
  };

  await insertTransaction({ payload: billTransaction });
}
```

### Lessons Learned

- **Data Validation**: Need systematic validation of account balances during data entry
- **Account Types**: Utility accounts require special handling due to their payment-first nature
- **Historical Data**: Regular reconciliation can prevent large-scale data inconsistencies
- **Double-Entry Principle**: Critical to maintain matching debits/credits for all financial transactions

This issue resolution restored proper accounting integrity and eliminated a significant data inconsistency that was affecting financial reporting accuracy.

## 4. Hooks with Dummy/Mock Data Values

**Analysis completed:** Identified 14 hooks that return dummy/mock values as fallback data when API calls fail.

### Hooks Using External Dummy Data Files:

1. **useAccountFetch.ts** - Returns `dummyAccounts` from `../data/dummyAccounts` (line 34)
2. **useCategoryFetch.ts** - Returns `dummyCategories` from `../data/dummyCategories` (line 29)
3. **useDescriptionFetch.ts** - Returns `dummyDescriptions` from `../data/dummyDescriptions` (line 29)
4. **useParameterFetch.ts** - Returns `dummyParameters` from `../data/dummyParameters` (line 31)
5. **usePaymentFetch.ts** - Returns `dummyPayments` from `../data/dummyPayments` (line 31)
6. **usePaymentRequiredFetch.ts** - Returns `dummyPaymentsRequired` from `../data/dummyPaymentsRequired` (line 29)
7. **useTotalsFetch.ts** - Returns `dummyTotals` from `../data/dummyTotals` (line 27)
8. **useTransactionByAccountFetch.ts** - Returns `dummyTransactions` from `../data/dummyTransactions` (line 36)
9. **useValidationAmountFetch.ts** - Returns `dummyValidationAmount` from `../data/dummyValidationAmount` (line 36)
10. **usePendingTransactionFetch.ts** - Returns `dummyPendingTransactions` from `../data/dummyPendingTransactions` (line 27)

### Hooks Using Hardcoded Dummy Data:

11. **useTotalsPerAccountFetch.ts** - Returns hardcoded totals object (lines 35-41):

    ```typescript
    {
      totalsOutstanding: 1.0,
      totalsFuture: 25.45,
      totalsCleared: -25.45,
      totals: 0.0
    }
    ```

12. **useTransactionByCategoryFetch.ts** - Returns hardcoded `dataTest` array with 5 transaction objects (lines 5-86, returns on line 114)

13. **useTransactionByDescriptionFetch.ts** - Returns hardcoded `dataTest` array with 5 transaction objects (lines 5-86, returns on line 117)

14. **useSportsData.ts** - Returns empty array `[]` as fallback (line 48)

### Summary:

- **Total hooks analyzed:** 44
- **Hooks with dummy data:** 14 (31.8%)
- **Pattern:** All dummy data is returned in catch blocks when API calls fail
- **Purpose:** Ensures application continues functioning with fallback data when backend is unavailable

### Recommendations:

- Consider adding visual indicators when dummy data is being displayed
- Review if all dummy data sources are still needed
- Evaluate whether some hooks should show loading states instead of dummy data
- Consider consolidating dummy data patterns for consistency
