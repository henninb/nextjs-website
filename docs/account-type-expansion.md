# Plan: Expand account_type Beyond debit/credit

## Context

The finance application hardcodes `account_type` as `"debit" | "credit"` throughout the Next.js frontend. The backend Kotlin API already defines 31 AccountType enum values (brokerage, savings, retirement_401k, retirement_ira, mortgage, and more), and the corresponding database migrations (V07 extending `t_account`, V20 extending `t_transaction`) have already been applied to production. The frontend is the primary bottleneck, but there are also backend native SQL queries in `AccountRepository.kt` that hardcode `'debit'` and `'credit'` string literals — those will miss transactions in new account types.

**Target new types:** `brokerage`, `retirement_401k`, `retirement_ira`, `savings`, `mortgage`  
**Approach:** Expose all 31 backend types in the frontend at once to avoid recurring this problem.

**Payment rules:** Asset-type accounts = payment sources. Liability-type accounts = payment destinations.  
**Transfer rules:** Any asset-type account can be source or destination (aligns with existing backend validation).

---

## Business Rules Reference

The backend `AccountType.kt` already categorizes all types:

| Category | Types |
|----------|-------|
| **Asset** | checking, savings, debit, brokerage, retirement_401k, retirement_ira, retirement_roth, pension, hsa, fsa, medical_savings, certificate, money_market, prepaid, gift_card, business_checking, business_savings, cash, escrow, trust |
| **Liability** | credit, credit_card, mortgage, auto_loan, student_loan, personal_loan, line_of_credit, business_credit |
| **Expense** | utility |

Billing due date calculation: `credit` and `credit_card` only (mortgages/loans use different billing semantics).  
Spending trends filter: `credit` and `credit_card` (not brokerage/savings).

---

## Phase 0 — Backend: AccountRepository.kt (raspi-finance-endpoint)

**File:** `src/main/kotlin/finance/repositories/AccountRepository.kt`

Lines 58, 66-67, 183, 192-193 contain native SQL that hardcodes `account_type = 'debit'` and `account_type = 'credit'` to compute net balances for dashboard totals:

```sql
-- Current (broken for new types):
SELECT SUM(amount) AS debits FROM t_transaction WHERE account_type = 'debit' ...
SELECT SUM(amount) AS credits FROM t_transaction WHERE account_type = 'credit' ...
```

Fix: expand each side to use the full list of asset/liability types, or join to `t_account` and filter by the `category` concept. The `AccountType.getAssetTypes()` and `getLiabilityTypes()` helper methods already exist on the Kotlin enum for this purpose.

This is a **backend-only change** in `raspi-finance-endpoint`. Deploy the backend before or alongside the frontend changes.

---

## Phase 1 — TypeScript Model & Validation (Foundation — do first)

Everything else depends on this phase.

### 1.1 `model/AccountType.ts`

Replace the current three-value union with all 31 backend values:

```typescript
export type AccountType =
  | "debit" | "credit" | "undefined"
  | "checking" | "savings" | "credit_card" | "certificate" | "money_market"
  | "brokerage" | "retirement_401k" | "retirement_ira" | "retirement_roth" | "pension"
  | "hsa" | "fsa" | "medical_savings"
  | "mortgage" | "auto_loan" | "student_loan" | "personal_loan" | "line_of_credit"
  | "utility" | "prepaid" | "gift_card"
  | "business_checking" | "business_savings" | "business_credit"
  | "cash" | "escrow" | "trust";
```

### 1.2 New file: `model/AccountTypeUtils.ts`

Centralizes category checks so no page does raw string comparisons. All conditional logic in Phases 2–4 imports from here.

```typescript
import { AccountType } from "./AccountType";

export const ASSET_ACCOUNT_TYPES: AccountType[] = [
  "debit", "checking", "savings", "certificate", "money_market",
  "brokerage", "retirement_401k", "retirement_ira", "retirement_roth", "pension",
  "hsa", "fsa", "medical_savings", "prepaid", "gift_card",
  "business_checking", "business_savings", "cash", "escrow", "trust"
];

export const LIABILITY_ACCOUNT_TYPES: AccountType[] = [
  "credit", "credit_card", "mortgage", "auto_loan", "student_loan",
  "personal_loan", "line_of_credit", "business_credit"
];

export const CREDIT_CARD_ACCOUNT_TYPES: AccountType[] = ["credit", "credit_card"];

export const ALL_ACCOUNT_TYPES: AccountType[] = [
  ...ASSET_ACCOUNT_TYPES, ...LIABILITY_ACCOUNT_TYPES, "utility"
];

export const isAssetAccount = (type: AccountType | string): boolean =>
  ASSET_ACCOUNT_TYPES.includes(type as AccountType);

export const isLiabilityAccount = (type: AccountType | string): boolean =>
  LIABILITY_ACCOUNT_TYPES.includes(type as AccountType);

export const isCreditCardAccount = (type: AccountType | string): boolean =>
  CREDIT_CARD_ACCOUNT_TYPES.includes(type as AccountType);
```

### 1.3 `utils/validation/schemas.ts` (line 110)

Replace:
```typescript
const accountTypeEnum = z.enum(["credit", "debit"], { message: "..." });
```
With all 31 values (inline the `ALL_ACCOUNT_TYPES` list). Update the error message to "Invalid account type".

### 1.4 `app/finance/page.tsx` — THREE hardcoded spots

**a) AccountCacheSchema (line 143-148):** Second inline Zod schema for localStorage caching:
```typescript
accountType: z.enum(["debit", "credit"]),  // ← expand to all 31 values
```

**b) Local `FilterState` type (line 176):** This page defines its own separate `FilterState` (mirrored in `SearchFilterBar.tsx`):
```typescript
accountType: "all" | "debit" | "credit"  // ← change to "all" | "asset" | "liability"
```

**c) Form validation error message (line 436-437):**
```typescript
// Update the inline validation check and error message
if (!accountTypeOptions.includes(typeNorm)) {
  errs.accountType = "Account type must be debit or credit";  // ← update message
}
```

### 1.5 `components/SearchFilterBar.tsx` — FilterState type + function signature (lines 25, 127)

This file has its own duplicate `FilterState` type definition AND a function signature that hardcodes the old values. Both must change:

```typescript
// Line 25 — type definition
accountType: "all" | "debit" | "credit"  // ← change to "all" | "asset" | "liability"

// Line 127 — function signature
const handleAccountTypeFilter = (type: "all" | "debit" | "credit") =>  // ← same change
```

### 1.6 `components/PresetFilters.tsx` — FilterState type (line 9)

Third copy of the same local `FilterState` type. Update to match:
```typescript
accountType: "all" | "debit" | "credit"  // ← change to "all" | "asset" | "liability"
```

### 1.7 `hooks/useAccountFetchGql.ts` (line 78)

Tighten the `as any` cast once the type is properly expanded:
```typescript
// BEFORE
accountType: (a.accountType as any) ?? "undefined",
// AFTER
accountType: (a.accountType as AccountType) ?? "undefined",
```

---

## Phase 2 — Conditional Logic (Highest-Risk Changes)

Replace every hardcoded `=== "debit"` / `=== "credit"` with helpers from Phase 1.2. Import from `model/AccountTypeUtils`.

### 2.1 `app/finance/page.tsx` — `computeCurrentDueDate` (line 60)

Billing due date applies to credit-card-type accounts only, NOT all liabilities (mortgages/loans have different billing semantics):
```typescript
// BEFORE
if (account.accountType !== "credit") return null;
// AFTER
if (!isCreditCardAccount(account.accountType)) return null;
```

### 2.2 `app/finance/page.tsx` — filter logic (line 278-279)

Update the account list filtering to use the category-based filter values:
```typescript
// BEFORE
account.accountType.toLowerCase() === activeFilters.accountType
// AFTER
activeFilters.accountType === "all" ||
(activeFilters.accountType === "asset" && isAssetAccount(account.accountType)) ||
(activeFilters.accountType === "liability" && isLiabilityAccount(account.accountType))
```

### 2.3 `app/finance/payments/page.tsx` (lines 685-686, 722)

```typescript
// BEFORE
account.accountType === "debit"   // source
account.accountType === "credit"  // destination
// AFTER
isAssetAccount(account.accountType)
isLiabilityAccount(account.accountType)
```

### 2.4 `app/finance/payments-next/page.tsx` (lines 464, 496)

Same substitution as 2.3.

### 2.5 `app/finance/transfers/page.tsx` (lines 168, 171, 181, 188, 199, 207)

Six occurrences, all `account.accountType === "debit"` → `isAssetAccount(account.accountType)`.

### 2.6 `app/finance/transfers-next/page.tsx` (lines 223, 247, 254, 265, 272)

Same substitution as 2.5 (five occurrences).

### 2.7 `components/BatchPaymentModal.tsx` (lines 389, 407)

```typescript
accounts.filter((a) => isAssetAccount(a.accountType))     // source
accounts.filter((a) => isLiabilityAccount(a.accountType)) // destination
```

### 2.8 `utils/parseTransactionPaste.ts` (lines 322-325)

The `isCreditAccount` flag controls sign convention for pasted bank statement amounts. All liability accounts share the same sign convention:
```typescript
// BEFORE
const isCreditAccount = accountType === "credit";
const isDebitAccount  = accountType === "debit";
// AFTER
const isCreditAccount = accountType ? isLiabilityAccount(accountType) : false;
const isDebitAccount  = accountType ? isAssetAccount(accountType) : false;
```

### 2.9 `hooks/useSpendingTrends.ts` (line 142)

Spending trends should include both credit-card account types:
```typescript
// BEFORE
accountTypeFilter: ["credit"],
// AFTER
accountTypeFilter: CREDIT_CARD_ACCOUNT_TYPES,  // ["credit", "credit_card"]
```

### 2.10 `app/finance/transactions/[accountNameOwner]/page.tsx` (lines 329, 2198)

Two "debit" fallback defaults exist when the current account is not yet loaded:

```typescript
// Line 329 — initial transaction state
const accountType = currentAccount?.accountType || ("debit" as AccountType);
// AFTER
const accountType = currentAccount?.accountType || ("undefined" as AccountType);

// Line 2198 — PasteTransactionsDialog prop
accountType={currentAccount?.accountType ?? "debit"}
// AFTER
accountType={currentAccount?.accountType ?? "undefined"}
```

Defaulting to "undefined" is safe because the account will be loaded before the user can interact with the paste dialog or insert a transaction.

### 2.11 `hooks/useTransactionInsert.ts` (line 49)

Update unsafe default:
```typescript
// BEFORE
accountType: payload.accountType || "debit"
// AFTER
accountType: payload.accountType || "undefined"
```

---

## Phase 3 — UI: Dropdowns & Filter Chips

### 3.1 `app/finance/page.tsx` — Account type dropdown options (line 214)

Replace:
```typescript
const accountTypeOptions = ["debit", "credit"];
```
With:
```typescript
const accountTypeOptions = ALL_ACCOUNT_TYPES;  // from model/AccountTypeUtils
```
The existing `Autocomplete` at lines 1045-1056 accepts a string[] options prop and will work as-is. The Tab-autocomplete logic at line 347 (`option.startsWith(inputValue)`) also still works with strings.

Optionally add `groupBy` to the `Autocomplete` to group by asset/liability category for better UX.

### 3.2 `components/SearchFilterBar.tsx` — Quick filter + filter chips

**Line 72 — "Payment Required" quick filter:**
```typescript
// BEFORE
accountType: "credit" as const,
// AFTER
accountType: "liability" as const,
```

**Lines 268-295 — Filter chips:** Replace the hardcoded "Debit" and "Credit" chip pair with three category chips:

```tsx
{["all", "asset", "liability"].map((type) => (
  <Chip
    key={type}
    label={type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
    onClick={() => handleAccountTypeFilter(type as "all" | "asset" | "liability")}
    color={activeFilters.accountType === type ? "primary" : "default"}
    ...
  />
))}
```

### 3.3 `components/PresetFilters.tsx` (line 36)

The "Payment Required" preset uses `accountType: "credit"`. Update to `accountType: "liability"` so it shows all liability-type accounts (credit cards, mortgages) that have balances.

---

## Phase 4 — AccountCard Icons & Styling

### 4.1 `components/AccountCard.tsx` (lines 63, 123-148)

Replace binary `isDebit` with category-based logic. Import `TrendingUpIcon`, `HomeIcon`, `AccountBalanceIcon` from MUI icons.

```typescript
// BEFORE
const isDebit = account.accountType.toLowerCase() === "debit";

// AFTER
import { isAssetAccount } from "../model/AccountTypeUtils";
const isAsset = isAssetAccount(account.accountType);

// Icon selection
const getAccountIcon = () => {
  const type = account.accountType;
  if (["brokerage", "retirement_401k", "retirement_ira", "retirement_roth", "pension"].includes(type))
    return <TrendingUpIcon fontSize="small" />;
  if (["mortgage", "auto_loan", "student_loan"].includes(type))
    return <HomeIcon fontSize="small" />;
  if (["savings", "checking", "money_market", "certificate"].includes(type))
    return <AccountBalanceIcon fontSize="small" />;
  return isAsset
    ? <AccountBalanceWalletIcon fontSize="small" />   // already imported
    : <CreditCardIcon fontSize="small" />;            // already imported
};
```

Use `isAsset` in place of `isDebit` for the color/backgroundColor styling logic.

---

## Phase 5 — Backup / Restore

### 5.1 `components/BackupRestore.tsx`

The backup serializes all account data (including `accountType`) as plain JSON strings — no structural change needed. The restore path calls `insertAccount({ payload: item })`, which passes through the updated Zod schema (Phase 1.3) before hitting the API.

**Action:** Verify that the restore path's schema validation uses `AccountSchema` from `utils/validation/schemas.ts` (already updated in 1.3) and not a separate inline schema.

### 5.2 `data/accounts.json` (test fixture data)

Currently has `"accountType": "debit"` and `"accountType": "credit"`. These remain valid AccountType values after the change — no breaking change. Optionally add examples with `"savings"` and `"brokerage"` for better test fixture coverage.

### 5.3 Database backup (`raspi-finance-database/run-backup.sh`)

The CSV export writes `account_type` as plain text. No changes required — the production DB CHECK constraint was already expanded by V07 and V20. Existing CSV backups with `"debit"` and `"credit"` values restore correctly since those values remain valid.

---

## Phase 6 — Tests

### Tests that will BREAK and must be updated:

| File | Line | Issue | Fix |
|------|------|-------|-----|
| `__tests__/components/SearchFilterBar.test.tsx` | 143, 218 | Uses `accountType: "debit"` as filter state value | Change to `"asset"` after FilterState type change |
| `__tests__/model/modelCoverage.test.ts` | 206, 230 | `accountTypes = ["credit", "debit", "undefined"]` — hardcoded 3-item list | Expand to include new types |
| `jest.setup.js` | 190, 204 | `accountType: "Debit"` (capital D) in global MSW mock | Change to `"debit"` — currently masked by `as any` cast in Phase 1.7; removing that cast will surface type errors |

### Tests that will PASS unchanged (no action needed):

- `__tests__/validation.test.ts` (lines 56, 75, 95, etc.): uses `"debit"` as a valid type for `AccountSchema` — still valid after expansion.
- `__tests__/app/finance/index.test.tsx` (line 252): Tab-completes "deb" → "debit" — "debit" still starts with "deb" in the expanded `accountTypeOptions` string array.
- `__tests__/app/finance/payments.test.tsx`: uses `"debit"` as source and `"credit"` as destination — `isAssetAccount("debit")` and `isLiabilityAccount("credit")` both return `true`, so filter behavior is preserved.
- `__tests__/app/finance/transfers.test.tsx`: uses `"debit"` accounts — `isAssetAccount("debit")` returns `true`, behavior preserved.
- `testHelpers.ts` (lines 92, 132): `createTestAccount()` uses `accountType: "checking"` — this was already an inconsistency with the old 3-value enum. After Phase 1.1, `"checking"` is a valid Asset type and requires no change.

### Tests to enhance (add new type coverage):

| File | What to add |
|------|-------------|
| `__tests__/hooks/useAccountInsert.test.ts` | Test insert with `brokerage`, `savings`, `mortgage` types |
| `__tests__/app/finance/accounts.test.tsx` | Add mock accounts with new types; verify they render with correct icons |
| `__tests__/app/finance/payments.test.tsx` | Add test: savings account (asset) appears as source; mortgage (liability) appears as destination |
| `__tests__/app/finance/transfers.test.tsx` | Add test: transfer between two savings accounts is allowed |

---

## Execution Order

1. **Phase 0** — Backend `AccountRepository.kt` SQL fixes (deploy to `raspi-finance-endpoint`)
2. **Phase 1** — Type + utility + all schema/FilterState expansions (everything depends on this)
3. **Phase 2** — Conditional logic replacements (highest risk of runtime breakage)
4. **Phase 3** — UI: dropdown options + filter chips
5. **Phase 4** — AccountCard icons/styling
6. **Phase 5** — Backup/restore schema verification
7. **Phase 6** — Tests: fix breaking tests first, then add coverage

---

## Complete File Change List

| File | Change |
|------|--------|
| `model/AccountType.ts` | Expand union type to 31 values |
| `model/AccountTypeUtils.ts` | **NEW** — category helpers and constants |
| `utils/validation/schemas.ts` | Expand `accountTypeEnum` z.enum |
| `app/finance/page.tsx` | AccountCacheSchema, FilterState type, filter logic, `computeCurrentDueDate`, `accountTypeOptions`, validation error message |
| `components/SearchFilterBar.tsx` | FilterState type (line 25), `handleAccountTypeFilter` signature (line 127), quick filter preset (line 72), chip labels → "Asset"/"Liability" (lines 270-287) |
| `components/PresetFilters.tsx` | FilterState type, preset filter value |
| `components/AccountCard.tsx` | Category-based icon/color logic |
| `components/BatchPaymentModal.tsx` | Asset/liability filter helpers |
| `app/finance/payments/page.tsx` | isAsset/isLiability filter helpers |
| `app/finance/payments-next/page.tsx` | isAsset/isLiability filter helpers |
| `app/finance/transfers/page.tsx` | isAsset filter helper (6 occurrences) |
| `app/finance/transfers-next/page.tsx` | isAsset filter helper (5 occurrences) |
| `app/finance/transactions/[accountNameOwner]/page.tsx` | "debit" default → "undefined" (lines 329, 2198) |
| `utils/parseTransactionPaste.ts` | isLiability/isAsset for sign convention |
| `hooks/useSpendingTrends.ts` | `CREDIT_CARD_ACCOUNT_TYPES` filter |
| `hooks/useTransactionInsert.ts` | Default accountType → `"undefined"` |
| `hooks/useAccountFetchGql.ts` | Remove `as any` cast |
| `__tests__/components/SearchFilterBar.test.tsx` | Update `"debit"` filter values to `"asset"` |
| `__tests__/model/modelCoverage.test.ts` | Expand accountTypes array |
| `jest.setup.js` | Fix `"Debit"` → `"debit"` (lines 190, 204) — capitalization bug exposed by Phase 1.7 |
| **Backend:** `AccountRepository.kt` | Expand native SQL debit/credit hardcodes |

---

## Verification

1. **TypeScript build:** `npm run build` — zero type errors after Phase 1.
2. **Tests:** `npm test` — all existing tests pass; breaking tests fixed in Phase 6.
3. **Database:** `psql -h postgresql.bhenning.com -U henninb -d finance_db` — run `\d t_account` to confirm expanded CHECK constraint; INSERT a row with `account_type = 'brokerage'` to confirm V07 is applied.
4. **Accounts page:** Add a new brokerage account — 31 types in dropdown; AccountCard renders with TrendingUp icon.
5. **Filter chips:** "Asset" chip shows savings/brokerage/checking; "Liability" chip shows credit/mortgage.
6. **Payments flow:** Savings account appears as source; mortgage account appears as destination.
7. **Transfers flow:** Transfer between savings and brokerage succeeds (no debit-only block).
8. **Spending trends:** Trends dashboard still scopes to credit-card accounts, not savings/brokerage.
9. **Backup/Restore:** Export backup containing a brokerage account; restore it; verify round-trip.

---

## No Database Schema Changes Required

V07 (`t_account` CHECK constraint) and V20 (`t_transaction` CHECK constraint) are already applied to production. The only remaining database concern is the backend native SQL in `AccountRepository.kt` (Phase 0).
