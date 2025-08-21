# TODO - Project Tasks

## 1. High Priority - Test Coverage Improvement

**Goal:** Achieve 100% test coverage (currently at 42.25%)

**Key Areas Needing Tests:**

- API routes (0% coverage): weather.js, lead.js, nfl.js, etc.
- Pages (0% coverage): \_app.tsx, index.jsx, registration.tsx
- Components with low coverage: Layout.tsx, USDAmountInput.tsx, SelectNavigateAccounts.tsx
- Hooks with low coverage: useTransactionInsert.ts, useTransferInsert.ts, useCategoryInsert.ts

**Instructions:**

- Follow consistent patterns and industry best practices for Jest tests
- Ensure tests are clear, maintainable, and easy to read
- If functionality changes seem necessary, prompt first before implementing

## 2. High Priority - Security Improvements

### 2.1 CSP Enhancement

- **Issue:** CSP allows `unsafe-inline` and `unsafe-eval` in production
- **Fix:** Remove both in production; use nonces or hashes for inline scripts
- **Priority:** HIGH

### 2.2 Global Caching Policy

- **Issue:** `Cache-Control: public, max-age=3600` applied to all routes including authenticated pages
- **Fix:** Default HTML/dynamic routes to `Cache-Control: no-store`; keep `public, max-age` only for static assets
- **Priority:** HIGH

### 2.3 Headers Inspection Page

- **Issue:** `pages/headers.tsx` exposes request headers including cookies
- **Fix:** Remove the page or guard behind strict auth and redact sensitive headers
- **Priority:** HIGH

## 3. Medium Priority - Error Handling Enhancements

### 3.1 User-Facing Error States

- **Missing:** Consistent error UI components
- **Current:** Basic error messages in hooks
- **Recommendation:** Standardized error display components
- **Priority:** MEDIUM

### 3.2 Network Error Recovery

- **Missing:** Retry strategies and offline detection
- **Current:** Basic React Query retry (1x)
- **Recommendation:** Exponential backoff, network status detection
- **Priority:** MEDIUM

### 3.3 API Error Handling Improvements

- **Issue:** Inconsistent error response formats
- **Current:** Mix of status codes and error objects
- **Recommendation:** Standardize API error responses
- **Priority:** MEDIUM

### 3.4 Logging and Monitoring

- **Missing:** Structured error logging for production
- **Current:** Development console.log only
- **Recommendation:** Implement error tracking service integration
- **Priority:** MEDIUM

## 4. Medium Priority - Security (Continued)

### 4.1 Middleware Security

- **Issue:** Middleware logs sensitive cookies/headers
- **Fix:** Remove cookie/header logging; gate debug logs behind `NODE_ENV !== 'production'`
- **Priority:** MEDIUM

### 4.2 CORS Configuration

- **Issue:** Overly permissive CORS on proxy responses
- **Fix:** Remove CORS headers from proxy responses or restrict to allowlist
- **Priority:** MEDIUM

### 4.3 Proxy Header Sanitization

- **Issue:** Proxy forwards most incoming headers verbatim
- **Fix:** Construct sanitized header set, drop unnecessary headers
- **Priority:** MEDIUM

### 4.4 CSRF Protection

- **Issue:** Missing CSRF protections for state-changing endpoints
- **Fix:** Implement double-submit cookie or header token validation
- **Priority:** MEDIUM

## 5. Low Priority - Code Quality

### 5.1 Form Validation Error Display

- **Issue:** Limited user feedback for validation errors
- **Current:** Basic error messages
- **Recommendation:** Enhanced form error states with field-level feedback
- **Priority:** LOW

### 5.2 Dummy Data Review

- **Status:** 14 hooks (31.8%) use dummy/mock data fallbacks
- **Recommendation:**
  - Add visual indicators when dummy data is displayed
  - Review if all dummy data sources are still needed
  - Consider consolidating dummy data patterns for consistency
- **Priority:** LOW

## ✅ Completed Items

- ✅ **ErrorBoundary Implementation:** Component created at `components/ErrorBoundary.tsx` with proper error handling and retry functionality
- ✅ **Weather API Key Security:** Moved to `process.env.WEATHER_API_KEY` with proper error handling
- ✅ **Powered By Header:** Set `poweredByHeader: false` in `next.config.mjs`
- ✅ **Account Balance Reconciliation:** centerpoint_brian utility account reconciled (Aug 2025)
- ✅ **Weather API Rate Limiting:** Implemented in `pages/api/weather.js`

---

within the finance app /pages/finance, I have several components like transfers, payments, transactions, accounts, configuration. These UI components have some slight UI differnences. I want you to act as a professional UI developer in nextjs and identify these differneces and make these pages have the same look and feel. a user friendly perspective is what I have in mind. focus on the modern UI, as the legacy UI will be going away. come up with a plan to work on and we can go from there.
_Last updated: August 2025_
