# Next.js App Router Migration Plan

**Project**: nextjs-website
**Migration Type**: Incremental (Pages Router → App Router)
**Timeline**: SLOW & GRADUAL - Multiple months, route-by-route
**Current Next.js Version**: 16.0.7
**Last Updated**: 2025-12-08
**Current Phase**: Phase 1 ✅ COMPLETED

## ⚠️ CRITICAL: This is a SLOW, GRADUAL Migration

**DO NOT RUSH THIS MIGRATION.** The goal is to migrate incrementally over several months, allowing thorough testing and validation at each step. This is NOT a sprint - it's a marathon.

## Executive Summary

This plan outlines the **slow, incremental migration** of the nextjs-website from Next.js Pages Router to App Router. The migration will leverage Server Components (RSC) for improved performance while maintaining backward compatibility during the entire transition.

**Active Development Context**: The codebase is under active development with recent pagination features, UI/UX modernization, and security improvements. This migration must not disrupt ongoing development work.

### Key Priorities

- ✅ **SLOW, incremental migration** (both routers coexist indefinitely)
- ✅ **One route at a time** - thorough testing before moving to next route
- ✅ Server Components (RSC) for data fetching
- ✅ Start with simple, low-risk pages first
- ✅ Special attention to middleware and authentication compatibility
- ✅ Case-by-case evaluation of 65 custom hooks
- ✅ **No disruption to ongoing development work**

---

## Migration Philosophy & Guiding Principles

### Core Principles

1. **Safety First**: Never break existing functionality. Both routers will coexist throughout the migration.

2. **One Thing at a Time**: Migrate ONE route, test thoroughly, monitor in production, then move to the next.

3. **Thorough Testing**: Every migration must include:
   - Unit tests
   - Integration tests
   - Manual testing
   - Production monitoring (1-2 weeks minimum)

4. **Respect Ongoing Development**: This migration should not block new features or bug fixes. The Pages Router remains fully functional.

5. **No Arbitrary Deadlines**: The timeline is a guide, not a mandate. Take longer if needed.

6. **Learn and Adapt**: Document learnings from each migration and adjust the plan accordingly.

7. **User Impact Minimization**: Users should experience zero disruption during the migration.

8. **Reversibility**: Any route can be rolled back by simply removing it from `/app` directory.

### When to Pause or Stop

**Pause the migration if:**

- You encounter repeated failures or bugs
- Tests are failing and you can't immediately fix them
- User feedback is negative
- Production monitoring reveals issues
- You're rushing or feeling pressured
- Ongoing development work needs full attention

**Stop the migration if:**

- Critical production issues arise
- The App Router isn't meeting your needs
- The migration is causing too much disruption
- You discover the current Pages Router is sufficient

**Remember**: There's no penalty for moving slowly or pausing. The Pages Router is fully supported and will continue to work.

---

## Migration Strategy Overview

### Approach

**Incremental Migration with Parallel Router Support**

Next.js 13+ supports running both routers simultaneously:

- Pages Router: `/pages` directory (existing)
- App Router: `/app` directory (new)
- Routes in `/app` take precedence over `/pages`

### Data Fetching Strategy

- **Server Components**: Default for all new routes (async/await data fetching)
- **Client Components**: Only when needed (interactivity, hooks, browser APIs)
- **Hybrid Pattern**: Server Components fetch initial data, Client Components handle mutations

### Hook Migration Strategy

| Hook Type                                                           | Strategy                                         |
| ------------------------------------------------------------------- | ------------------------------------------------ |
| **Read-only data fetching** (e.g., useTotalsFetch, useAccountFetch) | Convert to Server Component data fetching        |
| **Mutation hooks** (e.g., usePaymentInsert, useTransactionDelete)   | Keep as Client Components with React Query       |
| **Interactive hooks** (e.g., useUser, useLoginProcess)              | Keep as Client Components                        |
| **Validation hooks** (e.g., useValidationAmountFetch)               | Evaluate - may convert to server-side validation |

---

## Migration Progress & Status

### ✅ Phase 1: COMPLETED (December 8, 2025)

**Completed Tasks:**
- ✅ Created `/app` directory with foundational structure
- ✅ Set up root layout (`app/layout.tsx`) with MUI theme, providers, and global styles
- ✅ Created client-side providers wrapper (`app/providers.tsx`) for React Query, Auth, and UI Context
- ✅ Configured global error boundary (`app/error.tsx`)
- ✅ Created not-found page (`app/not-found.tsx`)
- ✅ Set up loading states (`app/loading.tsx`)
- ✅ Added "use client" directives to components (Layout, AuthProvider, ErrorBoundary)
- ✅ Fixed 20+ TypeScript strict-mode errors exposed by App Router setup
- ✅ Build succeeds with no errors
- ✅ Both routers coexist successfully
- ✅ Smoke tested in development - confirmed working

**Key Changes Made:**
1. **Component Updates**: Added `"use client"` to Layout, AuthProvider, ErrorBoundary, and loading component
2. **TypeScript Fixes**: Resolved nullable type issues in:
   - `AccountCard.tsx` (validationDate handling)
   - `MedicalExpenseForm.tsx` (serviceDate handling)
   - `ValidationDebugPanel.tsx` (validationErrors check)
   - `useAccountInsert.ts` (setupNewAccount function)
   - `usePendingTransactionUpdate.ts` (ID sanitization)
   - `useTransferInsert.ts` (overRideTransferValues function)
   - Multiple finance pages (categories, configuration, descriptions, index)
   - Transaction pages (setState handlers, undefined type assertions)
   - `transfers.tsx` (fetchedAccounts array handling)
   - `watch/index.tsx` (promises array typing)
   - `corsMiddleware.ts` (origin undefined check)

**Infrastructure Ready**: The App Router foundation is now in place and ready for gradual page migration.

---

## Recent Codebase Changes (Since October 2025)

**Important Updates to Be Aware Of:**

- ✅ **Next.js upgraded to 16.0.7** (from 15.5.2)
  - Turbopack configuration added to next.config.mjs
  - Runtime config replaced with environment variables
  - Enhanced security headers in next.config.mjs
- ✅ **Pagination feature added** - `useTransactionByAccountFetchPaged` hook created
- ✅ **Accounts page modernization completed** - Card-based layouts, search/filtering
- ✅ **UI/UX improvements** across multiple finance pages
- ✅ **Security fixes** implemented
- ✅ **91 tests passing** with comprehensive coverage
- ✅ **App Router Phase 1 completed** - Foundation infrastructure in place

**Migration Impact**: These changes demonstrate active development. The migration plan must accommodate ongoing feature work without blocking progress.

---

## Phase-by-Phase Migration Plan

### **Phase 1: Foundation & Setup** ✅ COMPLETED (December 8, 2025)

**Goal**: Set up the basic App Router structure without migrating any actual pages yet. This is purely foundational work.

**Timeline**: Completed in 1 session with thorough TypeScript error fixes.

#### 1.1 Initial App Router Setup

- [ ] Create `/app` directory structure
- [ ] Set up root layout (`app/layout.tsx`)
  - Port over theme configuration
  - Include global styles
- [ ] Configure global error boundary (`app/error.tsx`)
- [ ] Create not-found page (`app/not-found.tsx`)
- [ ] Set up loading states (`app/loading.tsx`)
- [ ] **TEST**: Build the project - ensure no errors
- [ ] **TEST**: Start dev server - ensure both routers coexist

#### 1.2 Shared Infrastructure Migration

- [ ] Create client-side providers wrapper (`app/providers.tsx`)
  - MUI ThemeProvider
  - React Query QueryClientProvider
  - UIContext provider
- [ ] Set up metadata API for SEO (replaces `_document.tsx`)
- [ ] **TEST**: Verify providers work in isolation
- [ ] **TEST**: Check that existing Pages Router pages still work

#### 1.3 Middleware Migration

**CRITICAL: Your middleware uses `experimental-edge` runtime - DO NOT CHANGE THIS**

**Next.js 16 Changes**: Ensure middleware is compatible with Next.js 16.0.7

Strategy:

- [ ] **First**: Test current middleware compatibility with empty `/app` directory
- [ ] Update middleware to support both `/pages` and `/app` routes
- [ ] Ensure nginx reverse proxy routing remains intact
- [ ] Verify local API bypass logic works with App Router routes
- [ ] Add App Router specific middleware matchers if needed
- [ ] **TEST**: Verify all existing routes still work
- [ ] **TEST**: Verify CORS, CSP, and security headers apply to both routers

```typescript
// middleware.ts updates needed
export const config = {
  matcher: [
    // Existing matchers
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
    // Add app router support
    "/(app)?/:path*",
  ],
};
```

#### 1.4 Testing Infrastructure

- [ ] Update Jest configuration for App Router (if needed)
- [ ] Research `@testing-library/react` support for Server Components
- [ ] Configure MSW for App Router Route Handlers
- [ ] Create test utilities for Server Component testing
- [ ] **TEST**: Run existing test suite - ensure all 91 tests still pass

**Milestone 1 Completion Criteria**:

- [ ] `/app` directory exists with basic structure
- [ ] Build succeeds with no errors
- [ ] All existing Pages Router routes still work
- [ ] All 91 tests still passing
- [ ] Middleware works with both routers

**⏸️ PAUSE**: Before proceeding to Phase 2, use the App Router infrastructure in production for at least 1-2 weeks to ensure stability.

---

### **Phase 2: First Simple Page Migration** (Milestone 2 - ONE PAGE AT A TIME)

**Goal**: Migrate ONE simple, low-risk page to validate the entire migration approach. Learn from this experience before proceeding.

**Timeline**: Take 1-2 weeks for this single page. Do not rush.

**Strategy**: Pick the simplest, least critical page first. Do NOT start with the home page or any finance pages.

#### 2.1 Choose Your First Migration Target

**Recommended First Page**: `/tools` or `/temperature` or a simple "how-to" page

Why these pages?

- Low traffic
- Simple content
- No authentication required
- No complex data fetching
- Easy to test
- Low risk if something goes wrong

**DO NOT migrate these yet:**

- Home page (too visible)
- Finance pages (too complex)
- Authentication pages (too critical)
- Blog (moderately complex)

#### 2.2 Migrate Your Chosen Simple Page

- [ ] Pick ONE simple page (e.g., `/pages/tools/index.jsx`)
- [ ] Create corresponding App Router route (e.g., `app/tools/page.tsx`)
- [ ] Convert to Server Component (or 'use client' if needed)
- [ ] Use metadata API for SEO
- [ ] **TEST**: Verify page works in dev mode
- [ ] **TEST**: Verify page works in production build
- [ ] **TEST**: Compare old vs new page side-by-side
- [ ] **TEST**: Check network tab - verify Server Component benefits
- [ ] **MONITOR**: Use the new route for 1-2 weeks
- [ ] Document any issues or learnings
- [ ] Only proceed to next page when confident

**⏸️ PAUSE**: Do not migrate another page until you're completely comfortable with the first migration.

---

### **Phase 3: Gradually Add More Simple Pages** (Milestone 3 - Weeks to Months)

**Goal**: Build confidence by migrating more simple, non-critical pages. One at a time, testing thoroughly between each.

**Timeline**: This phase could take 1-3 months. That's OK. Go slow.

#### 3.1 Static/Marketing Pages (ONE AT A TIME)

Suggested order (do ONE, test thoroughly, then move to next):

1. [ ] `/temperature/index.jsx` → `app/temperature/page.tsx`
   - **TEST thoroughly before next**
2. [ ] `/howto/index.jsx` → `app/howto/page.tsx`
   - **TEST thoroughly before next**
3. [ ] Individual how-to pages (docker, nextjs, etc.) - ONE AT A TIME
   - **TEST thoroughly between each**

**Between each migration:**

- [ ] Run full test suite
- [ ] Check production build
- [ ] Monitor for errors
- [ ] Document learnings

#### 3.2 Sports Data Pages (ONE AT A TIME)

These pages have data fetching but are relatively simple:

1. [ ] `/nhl/index.jsx` → `app/nhl/page.tsx`
   - Evaluate Server Component for data fetching
   - Keep grid as Client Component
   - **TEST thoroughly before next**
2. [ ] `/nba/index.jsx` → `app/nba/page.tsx`
   - **TEST thoroughly before next**
3. [ ] `/nfl/index.jsx` → `app/nfl/page.tsx`
   - **TEST thoroughly before next**
4. [ ] `/mlb/index.jsx` → `app/mlb/page.tsx`
   - **TEST thoroughly before next**

**⏸️ PAUSE**: After each page migration, pause and ensure stability before continuing.

---

### **Phase 4: Blog System Migration** (Milestone 4 - Take Several Weeks)

**Goal**: Migrate the blog system, which is moderately complex with MDX and dynamic routes.

**Timeline**: Allow 2-4 weeks for this phase. Blog systems have nuances.

**Current**: MDX with gray-matter and next-mdx-remote

Strategy:

- [ ] Research Next.js 16 best practices for MDX
- [ ] Create `app/blog/page.tsx` (blog index)
  - **TEST thoroughly**
- [ ] Create `app/blog/[slug]/page.tsx` (individual posts)
  - Migrate to Server Components with `generateStaticParams`
  - Use `next-mdx-remote` for Server Components
  - Update MDX content reading to async
  - **TEST thoroughly**
- [ ] Create `app/blog/topics/[topic]/page.tsx`
  - **TEST thoroughly**

```typescript
// app/blog/[slug]/page.tsx example
export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export default async function BlogPost({ params }: { params: { slug: string } }) {
  const post = await getPostBySlug(params.slug)
  return <MDXRemote source={post.content} />
}
```

#### 4.1 Testing Blog Migration

- [ ] Write tests for migrated blog pages
- [ ] Verify SEO metadata on all blog pages
- [ ] Test loading states
- [ ] Validate error boundaries
- [ ] Check that all blog posts render correctly
- [ ] **MONITOR**: Use blog routes for 2-3 weeks before proceeding

**⏸️ PAUSE**: Ensure blog is stable in production before moving to authentication.

---

### **Phase 5: Home Page Migration** (Milestone 5 - Take Your Time)

**Goal**: Migrate the home page (your most visible page).

**Timeline**: 1-2 weeks. This is a high-visibility page - be careful.

- [ ] Review current home page functionality (`/pages/index.jsx`)
- [ ] Create `app/page.tsx`
- [ ] Port all content and functionality
- [ ] Optimize with Server Components where possible
- [ ] Add proper metadata
- [ ] **TEST**: Extensively test the new home page
- [ ] **TEST**: Cross-browser testing
- [ ] **TEST**: Mobile responsiveness
- [ ] **MONITOR**: Use in production for 2-3 weeks
- [ ] Get user feedback

**⏸️ PAUSE**: Do not proceed to authentication until home page is stable.

---

### **Phase 6: Authentication & Protected Routes** (Milestone 6 - CRITICAL, Take Several Weeks)

**⚠️ EXTREME CAUTION**: This is the most critical phase. Authentication bugs can lock users out or expose security vulnerabilities.

**Timeline**: Allow 4-6 weeks minimum for this phase. Do not rush.

**CRITICAL PRIORITY**: Authentication flow migration

**Before Starting**:

- [ ] Document current authentication flow completely
- [ ] Create a test plan with all auth scenarios
- [ ] Set up staging environment for testing
- [ ] Plan rollback strategy

#### 6.1 Authentication Strategy Research

**Current Pages Router Pattern**:

```typescript
// pages/protected.tsx
export const getServerSideProps = withAuth(async (context) => {
  // Protected logic
});
```

**App Router Pattern**:

```typescript
// app/protected/page.tsx
import { redirect } from "next/navigation";
import { getSession } from "@/utils/auth";

export default async function ProtectedPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  // Page content
}
```

#### 6.2 Preparation Tasks (Week 1-2)

- [ ] Research Next.js 16 authentication best practices
- [ ] Evaluate cookies vs JWT for App Router
- [ ] Plan migration strategy in detail
- [ ] Document all current authentication flows
- [ ] Create comprehensive test plan
- [ ] **TEST**: Ensure all current auth flows work perfectly in Pages Router

#### 6.3 Create Authentication Utilities (Week 2-3)

- [ ] Create authentication utilities for App Router
  - `getSession()` - Server Component auth check
  - `useAuth()` - Client Component hook (keep existing)
  - `withAuth()` - Server Component wrapper
- [ ] Write unit tests for all utilities
- [ ] **TEST**: Test utilities in isolation

#### 6.4 Migrate Public Auth Pages First (Week 3-4)

Start with pages that don't require authentication:

- [ ] Migrate login page (`app/login/page.tsx`)
  - Keep as Client Component with existing useLoginProcess hook (safest)
  - OR research Server Actions for form submission
  - **TEST**: Login flow extensively
  - **TEST**: Error handling
  - **TEST**: Redirect after login
  - **MONITOR**: Use for 1-2 weeks before proceeding

- [ ] Migrate register page (`app/register/page.tsx`)
  - Similar pattern to login
  - **TEST**: Registration flow
  - **TEST**: Validation
  - **MONITOR**: Use for 1-2 weeks

- [ ] Migrate logout page
  - **TEST**: Logout flow
  - **TEST**: Session cleanup

**⏸️ PAUSE**: Do not proceed to protected routes until login/register/logout are stable.

#### 6.5 Test Authentication Integration (Week 5)

- [ ] Test login → redirect flow
- [ ] Test logout → redirect flow
- [ ] Test session persistence
- [ ] Test session expiration
- [ ] Test concurrent Pages/App Router auth
- [ ] **SECURITY REVIEW**: Have someone review auth implementation
- [ ] Document any issues found

**⏸️ PAUSE**: Fix any issues before proceeding to protected routes.

#### 6.6 Plan for Protected Routes (Do Not Start Yet)

**DO NOT START THIS SECTION UNTIL LOGIN/REGISTER/LOGOUT ARE STABLE**

Future work (Phase 7):

- Create `app/finance/layout.tsx` with auth check
- Migrate ONE simple protected page as test
- Gradually migrate finance pages

**Milestone 6 Completion Criteria:**

- [ ] Login works perfectly in App Router
- [ ] Register works perfectly in App Router
- [ ] Logout works perfectly in App Router
- [ ] Session management works correctly
- [ ] All auth tests passing
- [ ] Security review completed
- [ ] Used in production for 3-4 weeks with no issues

**⏸️ MAJOR PAUSE**: Spend at least a month using the new auth pages in production before migrating any finance pages.

---

### **Phase 7: Finance Pages Migration** (Milestone 7 - MOST COMPLEX, Take Many Months)

**⚠️ EXTREME CAUTION**: Finance pages are the core of your application. They have:

- Complex data fetching with pagination (recently added)
- CRUD operations on financial data
- Authentication requirements
- Modern UI/UX (recently improved)
- GraphQL integration
- State management complexity

**Timeline**: This phase could take 3-6 months or longer. Do not rush. Migrate ONE page at a time.

**Prerequisites**:

- [ ] All previous phases complete and stable
- [ ] Auth has been running in App Router for 1+ month with no issues
- [ ] Comprehensive backup of database
- [ ] Staging environment available for testing

#### 7.1 Finance Infrastructure Setup (Weeks 1-2)

- [ ] Create `app/finance/layout.tsx`
  - Authentication wrapper with proper redirects
  - Shared navigation (SelectNavigateAccounts)
  - Finance-specific providers
  - **TEST**: Verify layout works with empty child routes
  - **TEST**: Verify auth redirects work correctly

**⏸️ PAUSE**: Test the finance layout thoroughly before adding any child routes.

#### 7.2 First Finance Page - Read-Only Accounts Page (Weeks 3-6)

**Why start here**: The accounts page was recently modernized with cards, search, and filters. It's primarily read-only with some actions.

- [ ] Study current accounts page implementation (`/pages/finance/index.tsx`)
  - Note: Recently modernized with StatCard, SearchFilterBar, ViewToggle, AccountCard
  - Note: Has comprehensive tests (91 tests passing)
- [ ] Create `app/finance/page.tsx` (accounts overview)
  - Decide: Server Component for initial data OR keep as Client Component
  - Preserve all modern UI/UX improvements
  - Keep existing hooks or convert to Server Components
  - **TEST**: All functionality works (search, filter, view toggle, cards)
  - **TEST**: All 91 tests still pass
  - **TEST**: Grid/table view toggle works
  - **TEST**: Navigation to transactions works
  - **TEST**: Edit/Delete actions work
- [ ] Run side-by-side comparison for 2-3 weeks
- [ ] Get user feedback
- [ ] Fix any issues found

**⏸️ PAUSE**: Do not migrate another finance page until accounts page is perfect.

#### 7.3 Categories Page (Weeks 7-9)

Simpler than accounts, good second target:

- [ ] Create `app/finance/categories/page.tsx`
  - Evaluate: Server Component for initial data
  - Keep: Client Component for grid interactivity
  - **TEST**: CRUD operations work
  - **TEST**: Grid functionality works
- [ ] **MONITOR**: Use for 2-3 weeks

**⏸️ PAUSE**

#### 7.4 Descriptions and Configuration Pages (Weeks 10-12)

These pages have variants (regular and -next versions):

- [ ] Evaluate which version to migrate
- [ ] Migrate descriptions page
- [ ] Migrate configuration page
- [ ] **TEST** and **MONITOR** each

**⏸️ PAUSE**

#### 7.5 Complex Finance Pages - Transactions (Weeks 13-18)

**⚠️ HIGHEST COMPLEXITY**: Transactions page has:

- Pagination (recently added via `useTransactionByAccountFetchPaged`)
- Dynamic routes (`[accountNameOwner].tsx`)
- Category and description filtering
- Import functionality
- CRUD operations

Approach:

1. [ ] Study all transaction page variants
   - Main transactions page
   - Account-specific: `/transactions/[accountNameOwner]`
   - Category-specific: `/transactions/category/[categoryName]`
   - Description-specific: `/transactions/description/[descriptionName]`
   - Import page: `/transactions/import`

2. [ ] Migrate ONE variant at a time
   - Start with simplest variant
   - Use hybrid pattern:
     - Server Component for initial data
     - Client Component for DataGrid with mutations
   - Keep existing hooks (useTransactionInsert, useTransactionDelete, etc.)
   - Preserve pagination feature
   - **TEST** exhaustively after each variant
   - **MONITOR** each for 2-3 weeks

**⏸️ PAUSE BETWEEN EACH VARIANT**

#### 7.6 Payments and Transfers (Weeks 19-24)

These have GraphQL integration:

- [ ] Migrate payments page (`-next` variant if preferred)
  - Hybrid Server/Client pattern
  - Keep payment hooks
  - **TEST** payment workflows
  - **MONITOR** 2-3 weeks

**⏸️ PAUSE**

- [ ] Migrate transfers page (`-next` variant if preferred)
  - Keep GraphQL hooks for mutations
  - **TEST** transfer operations
  - **MONITOR** 2-3 weeks

**⏸️ PAUSE**

#### 7.7 Complex Form Pages (Weeks 25-30)

Keep these as Client Components (least priority):

- [ ] Medical expenses page
  - Complex form state
  - Family member management
  - **TEST** all CRUD operations
  - **MONITOR** 2-3 weeks

**⏸️ PAUSE**

- [ ] Backup/restore page
  - BackupRestore component
  - File operations
  - **TEST** backup and restore flows
  - **MONITOR** 2-3 weeks

**⏸️ PAUSE**

- [ ] Validation amounts page
  - **TEST** and **MONITOR**

**⏸️ PAUSE**

- [ ] Payment required page
  - **TEST** and **MONITOR**

**Milestone 7 Completion Criteria:**

- [ ] All finance pages migrated to App Router
- [ ] All functionality preserved
- [ ] All tests passing
- [ ] Performance same or better
- [ ] User feedback positive
- [ ] No regressions found
- [ ] Used in production for 2-3 months with no major issues

**⏸️ FINAL PAUSE**: Ensure all finance pages are stable before moving to API migration.

---

### **Phase 8: API Routes Migration** (Milestone 8 - Several Weeks)

**Goal**: Migrate API routes from Pages Router API routes to App Router Route Handlers.

**Timeline**: 4-8 weeks, depending on number of routes and complexity.

**Important**: Your nginx reverse proxy routing must be tested carefully with each API migration.

#### 8.1 Understand Current API Setup

Current local APIs (bypass finance service via nginx):

- `/api/nhl`, `/api/nba`, `/api/nfl`, `/api/mlb`
- `/api/celsius`, `/api/fahrenheit`
- `/api/lead`, `/api/player-ads`, `/api/player-analytics`, `/api/player-heartbeat`, `/api/player-metadata`
- `/api/weather`, `/api/uuid`, `/api/human`, `/api/health`

#### 8.2 Research Route Handlers in Next.js 16

- [ ] Read Next.js 16 Route Handlers documentation
- [ ] Understand differences from Pages API routes
- [ ] Plan migration approach

#### 8.3 Migrate Simple API Routes First (ONE AT A TIME)

Start with simplest routes:

```typescript
// app/api/health/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  return NextResponse.json({ status: "ok" });
}
```

Suggested order (do ONE, test, then next):

1. [ ] `/api/health` → `app/api/health/route.ts`
   - **TEST**: Route works
   - **TEST**: Nginx routing still works
   - **MONITOR**: 1 week

2. [ ] `/api/uuid/generate` → `app/api/uuid/generate/route.ts`
   - **TEST** and **MONITOR**

3. [ ] `/api/celsius` → `app/api/celsius/route.ts`
   - **TEST** and **MONITOR**

4. [ ] `/api/fahrenheit` → `app/api/fahrenheit/route.ts`
   - **TEST** and **MONITOR**

**⏸️ PAUSE BETWEEN EACH**

#### 8.4 Migrate Sports Data API Routes

5. [ ] `/api/nhl` → `app/api/nhl/route.ts`
6. [ ] `/api/nba` → `app/api/nba/route.ts`
7. [ ] `/api/nfl` → `app/api/nfl/route.ts`
8. [ ] `/api/mlb` → `app/api/mlb/route.ts`

**TEST nginx routing for each**, **MONITOR** each

**⏸️ PAUSE BETWEEN EACH**

#### 8.5 Migrate Player Analytics Routes

9. [ ] `/api/player-ads` → `app/api/player-ads/route.ts`
10. [ ] `/api/player-analytics` → `app/api/player-analytics/route.ts`
11. [ ] `/api/player-heartbeat` → `app/api/player-heartbeat/route.ts`
12. [ ] `/api/player-metadata` → `app/api/player-metadata/route.ts`

**TEST** and **MONITOR** each

**⏸️ PAUSE BETWEEN EACH**

#### 8.6 Migrate Remaining Routes

13. [ ] `/api/weather` → `app/api/weather/route.ts`
14. [ ] `/api/lead` → `app/api/lead/route.ts`
15. [ ] `/api/human` → `app/api/human/route.ts`

**TEST** and **MONITOR** each

#### 8.7 Update Middleware for Route Handlers

- [ ] Update `localApis` array in middleware.js if needed
- [ ] Test that middleware applies correctly to Route Handlers
- [ ] Verify nginx configuration still works
- [ ] Test CORS headers on Route Handlers

#### 8.8 GraphQL Integration (If Applicable)

- [ ] Migrate GraphQL proxy route if needed
- [ ] Test GraphQL hooks with App Router
- [ ] Keep existing GraphQL client setup
- [ ] Verify transfer operations work

**Milestone 8 Completion Criteria:**

- [ ] All local API routes migrated to Route Handlers
- [ ] Nginx routing works correctly
- [ ] Middleware applies to all Route Handlers
- [ ] All API tests passing
- [ ] No regressions in API functionality
- [ ] Used in production for 4-6 weeks with no issues

---

### **Phase 9: Final Testing, Optimization & Cleanup** (Milestone 9 - Several Weeks)

**Goal**: Ensure everything is working perfectly, optimize performance, and clean up.

**Timeline**: 3-4 weeks of final testing and optimization.

**Prerequisites**: All pages and API routes migrated and stable for at least 1 month.

#### 9.1 Comprehensive Testing (Week 1)

- [ ] Run full test suite - ensure all tests passing
- [ ] Review and update tests for Server Components
- [ ] Add integration tests for hybrid pages
- [ ] Test all authentication flows end-to-end
- [ ] Verify all 65 hooks still function correctly
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [ ] Mobile device testing (iOS, Android)
- [ ] Test all user flows from login to complex operations
- [ ] Load testing on critical pages
- [ ] Security audit

#### 9.2 Performance Optimization (Week 2)

- [ ] Analyze bundle size with `npm run analyze`
  - Compare with Pages Router baseline
  - Identify any bundle size increases
- [ ] Optimize Client Component boundaries
  - Ensure minimal client-side JavaScript
  - Push more work to Server Components where possible
- [ ] Add `loading.tsx` for all routes that need it
- [ ] Implement Suspense boundaries where beneficial
- [ ] Optimize images with Next.js Image component
- [ ] Review and optimize data fetching
- [ ] Test performance metrics:
  - First Contentful Paint (FCP)
  - Largest Contentful Paint (LCP)
  - Time to Interactive (TTI)
  - Total Blocking Time (TBT)

#### 9.3 SEO & Metadata (Week 2)

- [ ] Verify all pages have proper metadata
- [ ] Test OpenGraph tags on all pages
- [ ] Validate structured data
- [ ] Test social media sharing (Twitter, LinkedIn, Facebook)
- [ ] Verify sitemap generation
- [ ] Check robots.txt
- [ ] Test search engine indexing

#### 9.4 User Acceptance Testing (Week 3)

- [ ] Test all critical user flows with real users
- [ ] Verify finance data operations work perfectly
- [ ] Test blog reading experience
- [ ] Validate sports data pages
- [ ] Test authentication flows
- [ ] Get user feedback on performance and usability
- [ ] Address any feedback or issues found

#### 9.5 Documentation (Week 4)

- [ ] Update CLAUDE.md with App Router patterns
- [ ] Document new data fetching patterns
- [ ] Update component usage examples
- [ ] Create troubleshooting guide
- [ ] Document differences between Pages and App Router in your codebase
- [ ] Create migration retrospective document
- [ ] Update README if needed

#### 9.6 Final Monitoring Period

- [ ] Monitor production for 4-6 weeks
- [ ] Track error rates
- [ ] Monitor performance metrics
- [ ] Collect user feedback
- [ ] Fix any issues that arise

**Milestone 9 Completion Criteria:**

- [ ] All tests passing
- [ ] Performance metrics equal or better than Pages Router
- [ ] SEO maintained or improved
- [ ] User feedback positive
- [ ] No critical bugs or regressions
- [ ] Documentation complete and up-to-date

---

## Technical Considerations

### Middleware Compatibility

**Current Setup**:

- Runtime: `experimental-edge` (DO NOT CHANGE)
- Nginx reverse proxy integration
- Local API bypass logic
- CORS and CSP handling

**Migration Strategy**:

1. Keep `experimental-edge` runtime
2. Test middleware with App Router routes
3. Update matchers to include both `/pages` and `/app`
4. Ensure security middleware applies to both routers
5. Verify nginx proxy rules work with new routes

**Testing Checklist**:

- [ ] Local API routing (`/api/nhl`, `/api/weather`, etc.)
- [ ] GraphQL proxy (`/api/graphql`)
- [ ] Finance API routing
- [ ] CORS headers on App Router routes
- [ ] CSP reporting functionality

### Authentication Flow

**Pages Router Pattern**:

```typescript
// getServerSideProps with auth
export const getServerSideProps = withAuth(async (context) => {
  return { props: { user: context.user } };
});
```

**App Router Pattern**:

```typescript
// Server Component auth
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export default async function Page() {
  const session = await getSession(cookies())
  if (!session) redirect('/login')
  return <ProtectedContent user={session.user} />
}
```

**Key Changes**:

- Use `cookies()` helper from `next/headers`
- Use `redirect()` for unauthorized access
- Server Actions for form submissions (optional)
- Middleware for route protection (existing pattern works)

### Data Fetching Patterns

#### Pattern 1: Server Component Only (Read-Only)

```typescript
// app/finance/totals/page.tsx
async function getTotals() {
  const res = await fetch('http://localhost:3001/api/totals', {
    cache: 'no-store' // or 'force-cache' for static
  })
  return res.json()
}

export default async function TotalsPage() {
  const totals = await getTotals()
  return <TotalsDisplay data={totals} />
}
```

#### Pattern 2: Hybrid (Server Initial, Client Mutations)

```typescript
// app/finance/transactions/page.tsx
import { TransactionsClient } from './TransactionsClient'

async function getInitialTransactions() {
  const res = await fetch('http://localhost:3001/api/transactions')
  return res.json()
}

export default async function TransactionsPage() {
  const initialData = await getInitialTransactions()
  return <TransactionsClient initialData={initialData} />
}

// TransactionsClient.tsx
'use client'
export function TransactionsClient({ initialData }) {
  const { mutate } = useTransactionInsert()
  // Interactive logic
}
```

#### Pattern 3: Client Component Only (Complex State)

```typescript
// app/finance/backup/page.tsx
'use client'
import { BackupRestore } from '@/components/BackupRestore'

export default function BackupPage() {
  return <BackupRestore />
}
```

### Hook Migration Decision Matrix

| Hook Category         | Example Hooks                                                      | Strategy                    | Reasoning                           |
| --------------------- | ------------------------------------------------------------------ | --------------------------- | ----------------------------------- |
| **Fetch (Read-Only)** | `useTotalsFetch`, `useAccountFetch`, `useCategoryFetch`            | Convert to Server Component | No mutations, can leverage RSC      |
| **Mutations**         | `usePaymentInsert`, `useTransactionDelete`, `useTransactionUpdate` | Keep as Client Components   | React Query mutations work well     |
| **Authentication**    | `useUser`, `useLoginProcess`                                       | Keep as Client Components   | Complex state, client-side logic    |
| **Validation**        | `useValidationAmountFetch`                                         | Evaluate                    | May move to server-side validation  |
| **GraphQL**           | `useAccountFetchGql`, `useTransferInsertGql`                       | Keep as Client Components   | GraphQL client requires client-side |
| **Sports Data**       | `useSportsData`                                                    | Hybrid                      | Server fetch, client interactions   |
| **Medical Expenses**  | `useMedicalExpenseInsert/Update/Delete`                            | Keep as Client Components   | Complex forms with state            |

---

## File Structure

### Before (Pages Router)

```
nextjs-website/
├── pages/
│   ├── _app.tsx
│   ├── _document.tsx
│   ├── index.tsx
│   ├── login.tsx
│   ├── register.tsx
│   ├── finance/
│   │   ├── accounts.tsx
│   │   ├── transactions.tsx
│   │   └── ...
│   ├── blog/
│   │   └── [slug].tsx
│   └── api/
│       ├── nhl.ts
│       └── ...
├── components/
├── hooks/
├── contexts/
└── ...
```

### After (Incremental - Both Routers)

```
nextjs-website/
├── app/                          # NEW App Router
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Home page
│   ├── error.tsx                # Global error boundary
│   ├── not-found.tsx            # 404 page
│   ├── loading.tsx              # Global loading
│   ├── providers.tsx            # Client providers wrapper
│   ├── login/
│   │   └── page.tsx
│   ├── register/
│   │   └── page.tsx
│   ├── finance/
│   │   ├── layout.tsx           # Finance section layout
│   │   ├── accounts/
│   │   │   ├── page.tsx         # Server Component
│   │   │   └── loading.tsx
│   │   ├── transactions/
│   │   │   ├── page.tsx         # Server Component wrapper
│   │   │   └── TransactionsClient.tsx  # Client Component
│   │   └── ...
│   ├── blog/
│   │   ├── page.tsx             # Blog index
│   │   └── [slug]/
│   │       └── page.tsx         # Blog post
│   └── api/                     # Route Handlers
│       ├── nhl/
│       │   └── route.ts
│       └── ...
├── pages/                        # OLD Pages Router (gradually remove)
│   └── ... (unmigrated pages)
├── components/
│   ├── client/                   # NEW: Client Components
│   └── server/                   # NEW: Server Components
├── hooks/                        # Keep existing hooks
├── contexts/                     # Wrap in providers.tsx
└── ...
```

---

## Risk Mitigation

### Identified Risks

| Risk                           | Impact | Mitigation Strategy                                                      |
| ------------------------------ | ------ | ------------------------------------------------------------------------ |
| **Middleware incompatibility** | High   | Test early, keep experimental-edge runtime, gradual matcher updates      |
| **Authentication breaks**      | High   | Migrate auth early (Phase 3), comprehensive testing, rollback plan       |
| **React Query conflicts**      | Medium | Use providers.tsx wrapper, test both routers simultaneously              |
| **Breaking changes in tests**  | Medium | Update Jest config early, migrate tests with pages                       |
| **Nginx routing issues**       | Medium | Test local APIs thoroughly, update nginx config if needed                |
| **Performance regression**     | Low    | Monitor bundle size, use Suspense boundaries, optimize Client Components |
| **SEO metadata loss**          | Low    | Use metadata API, verify all pages before migration complete             |

### Rollback Plan

If critical issues arise:

1. **Immediate**: Remove problematic routes from `/app`
2. **Short-term**: Revert to Pages Router for affected pages
3. **Long-term**: Debug in development, re-migrate when fixed

Both routers coexist, so rollback is as simple as deleting `/app` routes.

---

## Testing Strategy

### Unit Tests

- [ ] Update Jest config for App Router
- [ ] Add Server Component testing utilities
- [ ] Test React Query integration with Client Components
- [ ] Test authentication utilities

### Integration Tests

- [ ] Test data flow from Server to Client Components
- [ ] Test mutation flows (insert, update, delete)
- [ ] Test authentication across both routers
- [ ] Test API Route Handlers

### E2E Tests (Optional but Recommended)

- [ ] Set up Playwright or Cypress
- [ ] Test critical user flows end-to-end
- [ ] Test finance operations (transactions, payments, transfers)
- [ ] Test authentication and protected routes

### MSW Configuration

```typescript
// Update MSW for App Router Route Handlers
// __mocks__/msw/handlers.ts
import { http, HttpResponse } from "msw";

export const handlers = [
  http.get("/api/accounts", () => {
    return HttpResponse.json([
      /* mock data */
    ]);
  }),
  // Add handlers for App Router routes
];
```

---

## Timeline Breakdown

**⚠️ IMPORTANT**: This is a SLOW, GRADUAL migration. The timeline below is a MINIMUM estimate. Take longer if needed.

| Phase                          | Timeline Estimate | Key Deliverables                                                  |
| ------------------------------ | ----------------- | ----------------------------------------------------------------- |
| **Phase 1**: Foundation        | 1-2 weeks         | App directory setup, middleware migration, testing infrastructure |
| **Phase 2**: First Simple Page | 1-2 weeks         | ONE simple page migrated, thoroughly tested                       |
| **Phase 3**: More Simple Pages | 1-3 months        | Utility pages, sports pages, how-to pages (one at a time)         |
| **Phase 4**: Blog System       | 2-4 weeks         | Blog index, individual posts, topic pages                         |
| **Phase 5**: Home Page         | 1-2 weeks         | Home page migration and testing                                   |
| **Phase 6**: Authentication    | 4-6 weeks         | Login, register, logout pages                                     |
| **Phase 7**: Finance Pages     | 3-6 months        | All finance functionality migrated (one page at a time)           |
| **Phase 8**: API Routes        | 4-8 weeks         | All API routes migrated to Route Handlers                         |
| **Phase 9**: Final Testing     | 3-4 weeks         | Comprehensive testing, optimization, documentation                |

**Total Duration**: 6-12 months (potentially longer)

**This is a marathon, not a sprint.** Allow time for:

- Testing between each migration
- Production monitoring periods
- Bug fixes and adjustments
- User feedback
- Ongoing feature development

### Migration Checklist Template (Use for Each Route)

When migrating each route, use this checklist:

- [ ] Read and understand the existing implementation
- [ ] Plan the migration approach
- [ ] Create the new App Router route
- [ ] Test in development mode
- [ ] Run relevant tests
- [ ] Test in production build locally
- [ ] Deploy to staging (if available)
- [ ] Test in staging
- [ ] Deploy to production
- [ ] Monitor for 1-2 weeks
- [ ] Document any issues or learnings
- [ ] Mark as complete
- [ ] **PAUSE** before next migration

### Weekly Review Template

Each week, review progress:

- [ ] What routes were migrated this week?
- [ ] What issues were encountered?
- [ ] What was learned?
- [ ] Are there any blockers?
- [ ] What's the plan for next week?
- [ ] Is the migration still on track?
- [ ] Do timelines need adjustment?

---

## Success Criteria

### Definition of Done

- [ ] All pages accessible via App Router
- [ ] All 97+ tests passing
- [ ] Authentication working across all protected routes
- [ ] Middleware compatible with both routers
- [ ] Nginx reverse proxy routing verified
- [ ] All 65 hooks functioning (migrated or preserved)
- [ ] No regression in functionality
- [ ] Performance metrics maintained or improved
- [ ] SEO metadata present on all pages
- [ ] Documentation updated
- [ ] Production build successful (`npm run build`)
- [ ] Production deployment successful (`npm run pages:build`)

### Performance Targets

- [ ] Bundle size: ≤ current size (use `npm run analyze`)
- [ ] First Contentful Paint: ≤ current performance
- [ ] Time to Interactive: ≤ current performance
- [ ] Test suite runtime: ≤ current runtime

---

## Resources & References

### Official Documentation

- [Next.js App Router Documentation](https://nextjs.org/docs/app)
- [Migrating from Pages to App Router](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)
- [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Client Components](https://nextjs.org/docs/app/building-your-application/rendering/client-components)
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Metadata API](https://nextjs.org/docs/app/building-your-application/optimizing/metadata)

### React Query with App Router

- [TanStack Query + Next.js App Router](https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr)
- [Hydration with Server Components](https://tanstack.com/query/latest/docs/framework/react/guides/ssr)

### Testing

- [Testing Server Components](https://nextjs.org/docs/app/building-your-application/testing)
- [Jest Configuration for App Router](https://nextjs.org/docs/app/building-your-application/testing/jest)
- [MSW with Next.js 15](https://mswjs.io/docs/integrations/node)

### Authentication Patterns

- [Authentication in App Router](https://nextjs.org/docs/app/building-your-application/authentication)
- [Middleware for Authentication](https://nextjs.org/docs/app/building-your-application/routing/middleware#authentication-and-authorization)

---

## Post-Migration Cleanup

### After Full Migration Complete

- [ ] Remove `/pages` directory
- [ ] Remove `pages/_app.tsx` and `pages/_document.tsx`
- [ ] Clean up unused Pages Router utilities
- [ ] Remove Pages Router specific dependencies (if any)
- [ ] Update package.json scripts if needed
- [ ] Archive this migration plan
- [ ] Create "App Router Best Practices" guide for team

### Optional Optimizations

- [ ] Implement Partial Prerendering (PPR) for eligible routes
- [ ] Add `generateStaticParams` for dynamic routes
- [ ] Optimize with `revalidate` for ISR patterns
- [ ] Implement streaming with Suspense
- [ ] Consider Server Actions for form submissions

---

## Notes & Decisions

### Decision Log

| Date       | Decision                         | Reasoning                                                         |
| ---------- | -------------------------------- | ----------------------------------------------------------------- |
| 2025-10-27 | Incremental migration            | Safer, allows testing at each step                                |
| 2025-10-27 | Server Components (RSC) strategy | Leverage App Router benefits, better performance                  |
| 2025-10-27 | Start with simple pages          | Validate approach before complex finance pages                    |
| 2025-10-27 | Case-by-case hook evaluation     | Balance between modernization and pragmatism                      |
| 2025-12-08 | **Major Plan Revision**          | Changed from 2-week sprint to 6-12 month gradual migration        |
| 2025-12-08 | One route at a time              | Reduce risk, allow thorough testing, accommodate ongoing dev work |
| 2025-12-08 | Extended monitoring periods      | Each migration requires 1-2 weeks of production monitoring        |
| 2025-12-08 | Updated for Next.js 16.0.7       | Reflect current Next.js version and recent codebase changes       |
| 2025-12-08 | Emphasized pause points          | Prevent rushing, ensure stability at each step                    |

### Open Questions

- [ ] Should we use Server Actions for forms or stick with API routes?
  - Recommendation: Start with API routes (safer, more familiar), evaluate Server Actions later
- [ ] Do we want to enable Partial Prerendering (experimental)?
  - Recommendation: Not initially - focus on stable migration first, optimize later
- [ ] Should GraphQL operations move server-side where possible?
  - Recommendation: Keep client-side initially, evaluate after migration is stable
- [ ] Do we need to update TypeScript configuration for App Router?
  - Answer: Likely yes - review during Phase 1 setup
- [ ] Should we create a staging environment for testing migrations?
  - Recommendation: Highly recommended for testing before production deployment

---

## Contact & Support

**Migration Lead**: Developer/Team responsible for migration
**Technical Issues**: Review this plan and CLAUDE.md
**Questions**: Add to "Open Questions" section above
**Progress Tracking**: Update this document as you complete each phase

---

**Last Updated**: 2025-12-08 (Phase 1 completion)
**Next Review**: After 1-2 week monitoring period, before starting Phase 2
**Migration Start Date**: December 8, 2025 (Phase 1 completed)
**Expected Completion**: 6-12 months from start date (flexible)
**Current Status**: ✅ Phase 1 Complete - Monitoring period in progress
