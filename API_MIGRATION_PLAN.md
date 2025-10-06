# API Migration Plan: Legacy to Modern Endpoints

## Executive Summary

The `raspi-finance-endpoint` project has been modernized with **standardized RESTful API endpoints**. The Next.js frontend currently uses **legacy endpoints** that should be migrated to the new modern patterns for better maintainability, consistency, and standards compliance.

## Current State Analysis

### Backend Architecture (raspi-finance-endpoint)

The Kotlin/Spring Boot backend now implements a **dual-endpoint strategy**:

1. **Modern Standardized Endpoints** (NEW)
   - Follow REST conventions strictly
   - Use `ServiceResult` pattern for error handling
   - Return proper HTTP status codes
   - Use camelCase parameter names
   - Consistent response structures

2. **Legacy Endpoints** (BACKWARD COMPATIBILITY)
   - Preserved for gradual migration
   - Use snake_case in some paths
   - Throw exceptions directly
   - Varied response patterns

### Frontend Usage (nextjs-website)

**Total hooks using API endpoints:** 65+
**Endpoints currently in use:** 50+ unique endpoints
**All hooks use legacy endpoints exclusively**

## Endpoint Comparison Tables

### Account Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List Active** | `GET /api/account/select/active` | `GET /api/account/active` | `useAccountFetch.ts` |
| **Get Single** | `GET /api/account/select/{accountNameOwner}` | `GET /api/account/{accountNameOwner}` | ❌ Not used |
| **Create** | `POST /api/account/insert` | `POST /api/account` | `useAccountInsert.ts` |
| **Update** | `PUT /api/account/update/{accountNameOwner}` | `PUT /api/account/{accountNameOwner}` | `useAccountUpdate.ts` |
| **Delete** | `DELETE /api/account/delete/{accountNameOwner}` | `DELETE /api/account/{accountNameOwner}` | `useAccountDelete.ts` |

**Key Differences:**
- Legacy throws 404 when no accounts exist; Modern returns empty array `[]`
- Legacy uses `/select/`, `/insert`, `/update/`, `/delete/` prefixes
- Modern uses standard REST verbs without action prefixes

### Transaction Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List All Active** | ❌ Not available | `GET /api/transaction/active` | ❌ Not used (returns `[]`) |
| **Get by ID** | `GET /api/transaction/select/{guid}` | `GET /api/transaction/{guid}` | `useTransactionFetch.ts` |
| **Create** | `POST /api/transaction/insert` | `POST /api/transaction` | `useTransactionInsert.ts` |
| **Update** | `PUT /api/transaction/update/{guid}` | `PUT /api/transaction/{guid}` | `useTransactionUpdate.ts` |
| **Delete** | `DELETE /api/transaction/delete/{guid}` | `DELETE /api/transaction/{guid}` | `useTransactionDelete.ts` |
| **By Account** | `GET /api/transaction/account/select/{accountNameOwner}` | ✅ Business endpoint (keep) | `useTransactionByAccountFetch.ts` |
| **By Category** | `GET /api/transaction/category/{category_name}` | ✅ Business endpoint (keep) | `useTransactionByCategoryFetch.ts` |
| **By Description** | `GET /api/transaction/description/{description_name}` | ✅ Business endpoint (keep) | `useTransactionByDescriptionFetch.ts` |
| **Update State** | `PUT /api/transaction/state/update/{guid}/{transactionStateValue}` | ✅ Business endpoint (keep) | `useTransactionStateUpdate.ts` |
| **Account Totals** | `GET /api/transaction/account/totals/{accountNameOwner}` | ✅ Business endpoint (keep) | `useTotalsPerAccountFetch.ts` |
| **Date Range** | ❌ Not used | `GET /api/transaction/date-range?startDate=...&endDate=...` | ❌ Not implemented |

**Key Differences:**
- Legacy CRUD uses action prefixes (`/select/`, `/insert`, etc.)
- Modern standardized endpoints for basic CRUD
- Business logic endpoints (by account, category, description) preserved as-is
- Modern adds pagination support for date-range queries

### Category Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List Active** | `GET /api/category/select/active` | `GET /api/category/active` | `useCategoryFetch.ts` |
| **Get Single** | `GET /api/category/select/{category_name}` | `GET /api/category/{categoryName}` | ❌ Not used |
| **Create** | `POST /api/category/insert` | `POST /api/category` | `useCategoryInsert.ts` |
| **Update** | `PUT /api/category/update/{category_name}` | `PUT /api/category/{categoryName}` | `useCategoryUpdate.ts` |
| **Delete** | `DELETE /api/category/delete/{categoryName}` | `DELETE /api/category/{categoryName}` | `useCategoryDelete.ts` |
| **Merge** | `PUT /api/category/merge?new=...&old=...` | ✅ Business endpoint (keep) | `useCategoryMerge.ts` |

**Key Differences:**
- Legacy uses snake_case path parameters (`category_name`)
- Modern uses camelCase (`categoryName`)
- Merge operation is business logic, not affected by standardization

### Description Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List Active** | `GET /api/description/select/active` | `GET /api/description/active` | `useDescriptionFetch.ts` |
| **Get Single** | ❌ Not implemented | `GET /api/description/{descriptionId}` | ❌ Not used |
| **Create** | `POST /api/description/insert` | `POST /api/description` | `useDescriptionInsert.ts` |
| **Update** | `PUT /api/description/update/{descriptionId}` | `PUT /api/description/{descriptionId}` | `useDescriptionUpdate.ts` |
| **Delete** | `DELETE /api/description/delete/{descriptionId}` | `DELETE /api/description/{descriptionId}` | `useDescriptionDelete.ts` |
| **Merge** | `PUT /api/description/merge?new=...&old=...` | ✅ Business endpoint (keep) | `useDescriptionMerge.ts` |

### Parameter Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List Active** | `GET /api/parameter/select/active` | `GET /api/parameter/active` | `useParameterFetch.ts` |
| **Get Single** | `GET /api/parameter/select/{parameterId}` | `GET /api/parameter/{parameterId}` | ❌ Not used |
| **Create** | `POST /api/parameter/insert` | `POST /api/parameter` | `useParameterInsert.ts` |
| **Update** | `PUT /api/parameter/update/{parameterId}` | `PUT /api/parameter/{parameterId}` | `useParameterUpdate.ts` |
| **Delete** | `DELETE /api/parameter/delete/{parameterId}` | `DELETE /api/parameter/{parameterId}` | `useParameterDelete.ts` |

### Payment Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List All** | `GET /api/payment/select` | `GET /api/payment/active` | `usePaymentFetch.ts` |
| **Get Single** | `GET /api/payment/select/{paymentId}` | `GET /api/payment/{paymentId}` | ❌ Not used |
| **Create** | `POST /api/payment/insert` | `POST /api/payment` | `usePaymentInsert.ts` |
| **Update** | `PUT /api/payment/update/{paymentId}` | `PUT /api/payment/{paymentId}` | `usePaymentUpdate.ts` |
| **Delete** | `DELETE /api/payment/delete/{paymentId}` | `DELETE /api/payment/{paymentId}` | `usePaymentDelete.ts` |

### Transfer Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List All** | `GET /api/transfer/select` | `GET /api/transfer/active` | `useTransferFetch.ts` |
| **Get Single** | `GET /api/transfer/select/{transferId}` | `GET /api/transfer/{transferId}` | ❌ Not used |
| **Create** | `POST /api/transfer/insert` | `POST /api/transfer` | `useTransferInsert.ts` |
| **Update** | `PUT /api/transfer/update/{transferId}` | `PUT /api/transfer/{transferId}` | `useTransferUpdate.ts` |
| **Delete** | `DELETE /api/transfer/delete/{transferId}` | `DELETE /api/transfer/{transferId}` | `useTransferDelete.ts` |

### Validation Amount Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List Active** | `GET /api/validation-amount/select/active` | `GET /api/validation-amount/active` | `useValidationAmountFetch.ts` |
| **Create** | `POST /api/validation-amount/insert` | `POST /api/validation-amount` | `useValidationAmountInsert.ts` |
| **Update** | `PUT /api/validation-amount/update/{validationAmountId}` | `PUT /api/validation-amount/{validationAmountId}` | `useValidationAmountUpdate.ts` |
| **Delete** | `DELETE /api/validation-amount/delete/{validationAmountId}` | `DELETE /api/validation-amount/{validationAmountId}` | `useValidationAmountDelete.ts` |

### Medical Expense Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List All** | `GET /api/medical-expenses` | `GET /api/medical-expense/active` | `useMedicalExpenseFetch.ts` |
| **Get Single** | `GET /api/medical-expenses/{medicalExpenseId}` | `GET /api/medical-expense/{medicalExpenseId}` | ❌ Not used |
| **Create** | `POST /api/medical-expenses/insert` | `POST /api/medical-expense` | `useMedicalExpenseInsert.ts` |
| **Update** | `PUT /api/medical-expenses/{medicalExpenseId}` | `PUT /api/medical-expense/{medicalExpenseId}` | `useMedicalExpenseUpdate.ts` |
| **Delete** | `DELETE /api/medical-expenses/{medicalExpenseId}` | `DELETE /api/medical-expense/{medicalExpenseId}` | `useMedicalExpenseDelete.ts` |

**Note:** Medical expenses currently use a mixed pattern - already partially modernized

### Family Member Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List All** | `GET /api/family-members` | `GET /api/family-member/active` | `useFamilyMemberFetch.ts` |
| **Create** | `POST /api/family-members/insert` | `POST /api/family-member` | `useFamilyMemberInsert.ts` |
| **Delete** | `DELETE /api/family-members/{familyMemberId}` | `DELETE /api/family-member/{familyMemberId}` | `useFamilyMemberDelete.ts` |

### Pending Transaction Endpoints

| Operation | Legacy Endpoint | Modern Endpoint | Frontend Hook |
|-----------|----------------|-----------------|---------------|
| **List All** | `GET /api/pending/transaction/all` | ❓ TBD | `usePendingTransactionFetch.ts` |
| **Delete Single** | `DELETE /api/pending/transaction/delete/{transactionId}` | ❓ TBD | `usePendingTransactionDelete.ts` |
| **Delete All** | `DELETE /api/pending/transaction/delete/all` | ❓ TBD | `usePendingTransactionDeleteAll.ts` |

**Note:** Pending transactions may not follow standardization pattern - confirm backend implementation

## Benefits of Migration

### 1. **Standards Compliance**
- REST conventions followed consistently
- Predictable endpoint patterns
- Industry-standard HTTP semantics

### 2. **Better Error Handling**
- Modern endpoints use `ServiceResult` pattern
- Structured error responses
- Consistent error codes and messages

### 3. **Type Safety**
- Modern endpoints return proper types
- No more `ResponseEntity<*>` wildcards
- Better TypeScript integration

### 4. **Improved Developer Experience**
- Intuitive endpoint naming
- No action prefixes to remember
- Clear separation of CRUD vs business logic

### 5. **Future-Proofing**
- Backend team committed to modern patterns
- Legacy endpoints will be deprecated
- New features use modern patterns only

## Migration Strategy

### Phase 1: Foundation (Week 1-2)

**Goal:** Set up infrastructure for gradual migration

**Tasks:**
1. Create new modern hook variants alongside legacy hooks
   - Naming: `useAccountFetchModern.ts` initially
   - Copy existing logic, update endpoints
   - Maintain same interface/return types

2. Create feature flag system
   ```typescript
   // utils/featureFlags.ts
   export const USE_MODERN_APIS = process.env.NEXT_PUBLIC_USE_MODERN_APIS === 'true';
   ```

3. Create API endpoint constants
   ```typescript
   // utils/apiEndpoints.ts
   export const API_ENDPOINTS = {
     account: {
       legacy: {
         list: '/api/account/select/active',
         get: '/api/account/select/:id',
         create: '/api/account/insert',
         update: '/api/account/update/:id',
         delete: '/api/account/delete/:id',
       },
       modern: {
         list: '/api/account/active',
         get: '/api/account/:id',
         create: '/api/account',
         update: '/api/account/:id',
         delete: '/api/account/:id',
       }
     },
     // ... more resources
   };
   ```

**Files to Create:**
- `/utils/featureFlags.ts`
- `/utils/apiEndpoints.ts`
- `/hooks/modern/useAccountFetch.ts` (example)

**Tests Required:**
- All new modern hooks need isolated tests (follow existing pattern)
- Integration tests comparing legacy vs modern responses

### Phase 2: Account & Transaction Migration (Week 3-4)

**Goal:** Migrate highest-traffic endpoints

**Priority Order:**
1. ✅ Account endpoints (5 hooks)
   - `useAccountFetch.ts` → `GET /api/account/active`
   - `useAccountInsert.ts` → `POST /api/account`
   - `useAccountUpdate.ts` → `PUT /api/account/{accountNameOwner}`
   - `useAccountDelete.ts` → `DELETE /api/account/{accountNameOwner}`
   - `useTotalsFetch.ts` → Keep business endpoint `/api/account/totals`

2. ✅ Transaction CRUD endpoints (5 hooks)
   - `useTransactionFetch.ts` → `GET /api/transaction/{guid}`
   - `useTransactionInsert.ts` → `POST /api/transaction`
   - `useTransactionUpdate.ts` → `PUT /api/transaction/{guid}`
   - `useTransactionDelete.ts` → `DELETE /api/transaction/{guid}`
   - `useTransactionByAccountFetch.ts` → Keep `/api/transaction/account/select/{accountNameOwner}`

**Implementation Steps per Hook:**
1. Create modern variant hook
2. Write comprehensive tests (success, errors, edge cases)
3. Update component to use modern hook with feature flag
4. Run integration tests
5. Monitor production for 1 week with feature flag OFF
6. Enable feature flag for 10% of users
7. Gradually increase to 100%
8. Remove legacy hook after 2 weeks of 100% modern usage

**Components to Update:**
- `/pages/finance/accounts/index.tsx`
- `/pages/finance/transactions/index.tsx`
- All transaction-related pages

### Phase 3: Master Data Migration (Week 5-6)

**Goal:** Migrate category, description, parameter endpoints

**Priority Order:**
1. ✅ Category endpoints (5 hooks + 1 business)
   - `useCategoryFetch.ts` → `GET /api/category/active`
   - `useCategoryInsert.ts` → `POST /api/category`
   - `useCategoryUpdate.ts` → `PUT /api/category/{categoryName}`
   - `useCategoryDelete.ts` → `DELETE /api/category/{categoryName}`
   - `useCategoryMerge.ts` → Keep `/api/category/merge` (business logic)

2. ✅ Description endpoints (5 hooks + 1 business)
   - `useDescriptionFetch.ts` → `GET /api/description/active`
   - `useDescriptionInsert.ts` → `POST /api/description`
   - `useDescriptionUpdate.ts` → `PUT /api/description/{descriptionId}`
   - `useDescriptionDelete.ts` → `DELETE /api/description/{descriptionId}`
   - `useDescriptionMerge.ts` → Keep `/api/description/merge` (business logic)

3. ✅ Parameter endpoints (4 hooks)
   - `useParameterFetch.ts` → `GET /api/parameter/active`
   - `useParameterInsert.ts` → `POST /api/parameter`
   - `useParameterUpdate.ts` → `PUT /api/parameter/{parameterId}`
   - `useParameterDelete.ts` → `DELETE /api/parameter/{parameterId}`

**Components to Update:**
- `/pages/finance/categories/index.tsx`
- `/components/SelectCategory.tsx`
- `/components/SelectDescription.tsx`

### Phase 4: Payment & Transfer Migration (Week 7-8)

**Goal:** Migrate payment and transfer endpoints

**Priority Order:**
1. ✅ Payment endpoints (5 hooks)
   - `usePaymentFetch.ts` → `GET /api/payment/active`
   - `usePaymentInsert.ts` → `POST /api/payment`
   - `usePaymentUpdate.ts` → `PUT /api/payment/{paymentId}`
   - `usePaymentDelete.ts` → `DELETE /api/payment/{paymentId}`

2. ✅ Transfer endpoints (5 hooks)
   - `useTransferFetch.ts` → `GET /api/transfer/active`
   - `useTransferInsert.ts` → `POST /api/transfer`
   - `useTransferUpdate.ts` → `PUT /api/transfer/{transferId}`
   - `useTransferDelete.ts` → `DELETE /api/transfer/{transferId}`

**Components to Update:**
- `/pages/finance/payments/index.tsx`
- `/pages/finance/transfers/index.tsx`

### Phase 5: Specialized Features (Week 9-10)

**Goal:** Migrate remaining specialized endpoints

**Priority Order:**
1. ✅ Validation Amount endpoints (4 hooks)
   - `useValidationAmountFetch.ts` → `GET /api/validation-amount/active`
   - `useValidationAmountInsert.ts` → `POST /api/validation-amount`
   - `useValidationAmountUpdate.ts` → `PUT /api/validation-amount/{validationAmountId}`
   - `useValidationAmountDelete.ts` → `DELETE /api/validation-amount/{validationAmountId}`

2. ✅ Medical Expense endpoints (already partially modern)
   - Review current implementation
   - Align with full modern pattern
   - Update to use `/api/medical-expense/active` for consistency

3. ✅ Family Member endpoints
   - `useFamilyMemberFetch.ts` → `GET /api/family-member/active`
   - `useFamilyMemberInsert.ts` → `POST /api/family-member`
   - `useFamilyMemberDelete.ts` → `DELETE /api/family-member/{familyMemberId}`

**Components to Update:**
- `/pages/finance/medical-expenses/index.tsx`
- `/components/MedicalExpenseForm.tsx`

### Phase 6: Cleanup & Optimization (Week 11-12)

**Goal:** Remove legacy code and optimize

**Tasks:**
1. Remove all legacy hooks
2. Remove feature flag system
3. Remove legacy endpoint constants
4. Update all tests to use modern endpoints only
5. Update API documentation
6. Performance benchmarking
7. Error monitoring review

**Files to Remove:**
- All `hooks/*Fetch.ts` (legacy versions)
- `utils/featureFlags.ts` (if no other features use it)
- Legacy endpoint constants from `utils/apiEndpoints.ts`

**Documentation Updates:**
- Update README.md with new API patterns
- Update CLAUDE.md with modern endpoint examples
- Create API_REFERENCE.md with all modern endpoints

## Risk Mitigation

### 1. **Breaking Changes**

**Risk:** Modern endpoints may have subtle differences in response format
**Mitigation:**
- Comprehensive integration tests comparing legacy vs modern
- Feature flag rollout (10% → 50% → 100%)
- Keep legacy endpoints available for quick rollback
- Monitor error rates closely during migration

### 2. **Data Inconsistencies**

**Risk:** Different error handling may expose edge cases
**Mitigation:**
- Run both legacy and modern hooks in parallel (shadow mode)
- Compare results and log discrepancies
- Fix backend inconsistencies before full migration
- Thorough testing in staging environment

### 3. **Performance Impact**

**Risk:** Modern endpoints may have different performance characteristics
**Mitigation:**
- Load testing before migration
- Monitor response times during rollout
- Cache strategy review
- Database query optimization if needed

### 4. **User Experience**

**Risk:** Bugs during migration affect users
**Mitigation:**
- Gradual rollout with feature flags
- Enhanced error logging
- Quick rollback mechanism
- User feedback monitoring

## Testing Strategy

### 1. **Unit Tests**

For each modern hook:
- Isolated business logic tests (follow existing pattern)
- Mock fetch responses
- Test success scenarios
- Test error scenarios (401, 403, 404, 500, network errors)
- Test edge cases

**Example:** `__tests__/hooks/modern/useAccountFetch.isolated.test.ts`

### 2. **Integration Tests**

Compare legacy vs modern:
- Same input → same output
- Error parity
- Performance comparison
- Response time tracking

**Example:** `__tests__/integration/legacyVsModern/account.test.ts`

### 3. **E2E Tests**

Full user workflows:
- Create account → list accounts → update → delete
- Transaction lifecycle tests
- Payment cascade operations
- Search and filter operations

### 4. **Regression Tests**

- Run full existing test suite
- All 2,172 existing tests must pass
- No breaking changes to UI

## Monitoring & Rollback

### 1. **Metrics to Track**

- **Error Rates**: By endpoint and hook
- **Response Times**: P50, P95, P99
- **Success Rates**: 2xx vs 4xx vs 5xx
- **Feature Flag Usage**: % of users on modern vs legacy

### 2. **Logging Strategy**

```typescript
// Enhanced logging for migration
logger.info('API_MIGRATION', {
  hook: 'useAccountFetch',
  version: 'modern',
  endpoint: '/api/account/active',
  responseTime: 123,
  statusCode: 200,
  userSegment: 'beta_10pct'
});
```

### 3. **Rollback Triggers**

Automatic rollback if:
- Error rate > 5% for any endpoint
- Response time > 2x baseline
- Any 500 errors in first 100 requests

Manual rollback if:
- User complaints spike
- Data inconsistencies detected
- Critical bug discovered

### 4. **Rollback Procedure**

1. Set feature flag to `false`
2. Deploy hotfix if needed
3. Investigate root cause
4. Fix and retest in staging
5. Gradual re-rollout

## Success Criteria

### Phase Completion

Each phase is complete when:
- ✅ All hooks migrated
- ✅ All tests passing (100% coverage maintained)
- ✅ 100% of users on modern endpoints
- ✅ Error rates < baseline
- ✅ Response times ≤ baseline
- ✅ Zero user complaints

### Overall Migration Success

- ✅ All 65+ hooks using modern endpoints
- ✅ Legacy hooks removed
- ✅ Feature flag system removed
- ✅ Test count maintained or increased (2,172+)
- ✅ Performance improved or maintained
- ✅ Code complexity reduced (fewer action prefixes)
- ✅ Documentation updated

## Timeline Summary

| Phase | Duration | Hooks Migrated | Risk Level |
|-------|----------|----------------|------------|
| **Phase 1: Foundation** | 2 weeks | 0 (infrastructure) | Low |
| **Phase 2: Account & Transaction** | 2 weeks | 10 hooks | Medium |
| **Phase 3: Master Data** | 2 weeks | 14 hooks | Low |
| **Phase 4: Payment & Transfer** | 2 weeks | 10 hooks | Low |
| **Phase 5: Specialized** | 2 weeks | 9+ hooks | Low |
| **Phase 6: Cleanup** | 2 weeks | 0 (removal) | Low |
| **Total** | **12 weeks** | **43+ hooks** | **Medium** |

## Appendix A: Modern Endpoint Patterns

### Standard CRUD Pattern

```typescript
// Modern pattern - consistent across all resources
GET    /api/{resource}/active          // List all active
GET    /api/{resource}/{id}            // Get single by ID
POST   /api/{resource}                 // Create new
PUT    /api/{resource}/{id}            // Update existing
DELETE /api/{resource}/{id}            // Delete by ID
```

### Legacy Pattern (Deprecated)

```typescript
// Legacy pattern - inconsistent, being phased out
GET    /api/{resource}/select/active   // List all active
GET    /api/{resource}/select/{id}     // Get single by ID
POST   /api/{resource}/insert          // Create new
PUT    /api/{resource}/update/{id}     // Update existing
DELETE /api/{resource}/delete/{id}     // Delete by ID
```

### Business Logic Endpoints (Preserved)

These endpoints are **NOT** part of standardization and should remain unchanged:

```typescript
// Account business logic
GET /api/account/totals
GET /api/account/payment/required
PUT /api/account/rename?old=...&new=...
PUT /api/account/deactivate/{accountNameOwner}
PUT /api/account/activate/{accountNameOwner}
GET /api/account/validation/refresh

// Transaction business logic
GET /api/transaction/account/select/{accountNameOwner}
GET /api/transaction/account/totals/{accountNameOwner}
GET /api/transaction/category/{category_name}
GET /api/transaction/description/{description_name}
GET /api/transaction/date-range?startDate=...&endDate=...
PUT /api/transaction/state/update/{guid}/{transactionStateValue}
PUT /api/transaction/update/account
PUT /api/transaction/update/receipt/image/{guid}
POST /api/transaction/future/insert

// Category business logic
PUT /api/category/merge?new=...&old=...

// Description business logic
PUT /api/description/merge?new=...&old=...
```

## Appendix B: Response Format Differences

### Legacy Error Response

```json
{
  "timestamp": "2025-01-15T10:30:00.000+00:00",
  "status": 404,
  "error": "Not Found",
  "message": "Account not found: checking_john",
  "path": "/api/account/select/checking_john"
}
```

### Modern Error Response

```json
{
  "error": "Account not found: checking_john"
}
```

**OR** for validation errors:

```json
{
  "errors": [
    "accountNameOwner is required",
    "accountType must be one of: debit, credit"
  ]
}
```

### Legacy Success Response (List)

```json
[
  {
    "accountId": 1,
    "accountNameOwner": "checking_john",
    "accountType": "debit",
    "activeStatus": true,
    ...
  }
]
```

### Modern Success Response (List)

**Same format** - no changes for successful list responses

### Empty List Difference

**Legacy:** Throws 404 error
**Modern:** Returns `[]` (empty array)

This is the **most significant behavioral difference** and must be handled in frontend code.

## Appendix C: Hook Migration Checklist

For each hook being migrated:

- [ ] Create modern variant hook in `/hooks/modern/`
- [ ] Update fetch URL to modern endpoint
- [ ] Handle empty array response (if list endpoint)
- [ ] Update error handling for new response format
- [ ] Write isolated tests (`__tests__/hooks/modern/*.isolated.test.ts`)
- [ ] Write integration test comparing legacy vs modern
- [ ] Update component imports with feature flag
- [ ] Test in development environment
- [ ] Deploy to staging
- [ ] Enable feature flag for 10% users
- [ ] Monitor for 3 days
- [ ] Increase to 50% users
- [ ] Monitor for 3 days
- [ ] Increase to 100% users
- [ ] Monitor for 1 week
- [ ] Remove legacy hook
- [ ] Remove feature flag conditional
- [ ] Update documentation

## Appendix D: GraphQL Considerations

**Note:** Several hooks use GraphQL endpoints:

- `useAccountFetchGql.ts`
- `useTransferFetchGql.ts`
- `useTransferInsertGql.ts`
- `usePaymentInsertGql.ts`
- `usePaymentFetchGql.ts`
- `usePaymentDeleteGql.ts`
- `usePaymentUpdateGql.ts`
- `useTransferDeleteGql.ts`
- `useTransferUpdateGql.ts`

**GraphQL endpoints are separate from REST modernization.**

These hooks:
1. Are already using a modern pattern (GraphQL)
2. Should be evaluated separately for REST vs GraphQL decision
3. May be migrated to modern REST OR kept as GraphQL
4. Decision should be based on:
   - Query complexity
   - Data fetching requirements
   - Performance needs
   - Team preference

**Recommendation:** Keep GraphQL endpoints for complex queries involving multiple resources. Use modern REST for simple CRUD operations.

## Appendix E: Contact & Support

**Backend Team:** raspi-finance-endpoint maintainers
**Frontend Team:** nextjs-website maintainers
**Migration Lead:** TBD
**Questions:** Create issue in respective repository

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Draft - Awaiting Approval
