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

1. **Create ErrorBoundary component** - Wrap _app.tsx and critical sections
2. **Implement ErrorService class** - Centralized error handling with categorization
3. **Add ErrorDisplay components** - Reusable error UI components
4. **Enhance React Query configuration** - Better retry strategies and error handling
5. **Standardize API error responses** - Consistent error format across all endpoints
6. **Add error tracking integration** - Sentry or similar for production monitoring
7. **Implement network status detection** - Handle offline scenarios
8. **Add loading states with error fallbacks** - Better UX during error states
