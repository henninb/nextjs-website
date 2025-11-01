# Next.js App Router Migration Plan

**Project**: nextjs-website
**Migration Type**: Incremental (Pages Router → App Router)
**Timeline**: 1-2 weeks
**Last Updated**: 2025-10-27

## Executive Summary

This plan outlines the incremental migration of the nextjs-website from Next.js Pages Router to App Router. The migration will leverage Server Components (RSC) for improved performance while maintaining backward compatibility during the transition.

### Key Priorities

- ✅ Incremental migration (both routers coexist)
- ✅ Server Components (RSC) for data fetching
- ✅ Start with simple pages, progress to complex finance features
- ✅ Special attention to middleware and authentication compatibility
- ✅ Case-by-case evaluation of 65 custom hooks

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

## Phase-by-Phase Migration Plan

### **Phase 1: Foundation & Setup** (Days 1-2)

#### 1.1 Initial App Router Setup

- [ ] Create `/app` directory structure
- [ ] Set up root layout (`app/layout.tsx`)
- [ ] Configure global error boundary (`app/error.tsx`)
- [ ] Create not-found page (`app/not-found.tsx`)
- [ ] Set up loading states (`app/loading.tsx`)

#### 1.2 Shared Infrastructure Migration

- [ ] Move theme configuration to App Router compatible format
- [ ] Create client-side providers wrapper (`app/providers.tsx`)
  - MUI ThemeProvider
  - React Query QueryClientProvider
  - UIContext provider
- [ ] Set up metadata API for SEO (replaces `_document.tsx`)

#### 1.3 Middleware Migration

**CRITICAL: Your middleware uses `experimental-edge` runtime**

Strategy:

- [ ] Test current middleware compatibility with App Router
- [ ] Update middleware to support both `/pages` and `/app` routes
- [ ] Ensure nginx reverse proxy routing remains intact
- [ ] Verify local API bypass logic works with App Router
- [ ] Add App Router specific middleware matchers if needed

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

- [ ] Update Jest configuration for App Router
- [ ] Add `@testing-library/react` support for Server Components
- [ ] Configure MSW for App Router Route Handlers
- [ ] Create test utilities for Server Component testing

**Expected Completion**: End of Day 2

---

### **Phase 2: Simple Pages Migration** (Days 3-5)

Migrate static and simple pages first to validate the approach.

#### 2.1 Static/Marketing Pages

- [ ] Home page (`/` → `app/page.tsx`)
  - Move to Server Component
  - Use metadata API for SEO
  - Keep minimal client-side interactivity

- [ ] About page (if exists)
- [ ] Contact page (if exists)

#### 2.2 Blog System Migration

**Current**: MDX with gray-matter and next-mdx-remote

Strategy:

- [ ] Create `app/blog/page.tsx` (blog index)
- [ ] Create `app/blog/[slug]/page.tsx` (individual posts)
- [ ] Migrate to Server Components with `generateStaticParams`
- [ ] Use `next/mdx` or keep `next-mdx-remote` for Server Components
- [ ] Update MDX content reading to async Server Components

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

#### 2.3 Utility Pages

- [ ] Sports data pages (NHL, NBA, NFL, MLB)
  - Evaluate Server Components for data fetching
  - Keep grids as Client Components
- [ ] Weather page
- [ ] Player analytics pages

#### 2.4 Testing Phase 2

- [ ] Write tests for migrated pages
- [ ] Verify SEO metadata
- [ ] Test loading states
- [ ] Validate error boundaries

**Expected Completion**: End of Day 5

---

### **Phase 3: Authentication & Protected Routes** (Days 6-8)

**CRITICAL PRIORITY**: Authentication flow migration

#### 3.1 Authentication Strategy

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

#### 3.2 Migration Tasks

- [ ] Create authentication utilities for App Router
  - `getSession()` - Server Component auth check
  - `useAuth()` - Client Component hook (keep existing)
  - `withAuth()` - Server Component wrapper

- [ ] Migrate login page (`app/login/page.tsx`)
  - Use Server Actions for form submission OR
  - Keep as Client Component with existing useLoginProcess hook

- [ ] Migrate register page (`app/register/page.tsx`)
  - Similar pattern to login

- [ ] Update protected routes pattern
  - Create `app/finance/layout.tsx` for finance section
  - Add authentication check in layout
  - Child pages automatically protected

#### 3.3 Session Management

- [ ] Evaluate cookies vs JWT for App Router
- [ ] Update middleware authentication logic
- [ ] Test session persistence across navigation
- [ ] Verify logout flow

#### 3.4 Testing Authentication

- [ ] Test protected route access
- [ ] Test redirect flows
- [ ] Test session expiration
- [ ] Test concurrent Pages/App Router auth

**Expected Completion**: End of Day 8

---

### **Phase 4: Finance Pages Migration** (Days 9-12)

Migrate core finance functionality with complex data requirements.

#### 4.1 Finance Layout

- [ ] Create `app/finance/layout.tsx`
  - Authentication wrapper
  - Shared navigation (SelectNavigateAccounts)
  - Finance-specific providers

#### 4.2 Read-Only Finance Pages (Server Components)

Migrate these to use Server Components:

- [ ] `app/finance/totals/page.tsx`
  - Replace `useTotalsFetch` with Server Component data fetching
  - Keep as read-only Server Component

- [ ] `app/finance/accounts/page.tsx`
  - Replace `useAccountFetch` with async fetch

- [ ] `app/finance/categories/page.tsx`
  - Server Component for initial data
  - Client Component for grid interactivity

#### 4.3 Interactive Finance Pages (Hybrid)

These require Client Components for mutations:

- [ ] `app/finance/transactions/page.tsx`
  - Server Component for initial data
  - Client Component for DataGrid with mutations
  - Keep mutation hooks (useTransactionInsert, useTransactionDelete)

- [ ] `app/finance/payments/page.tsx`
  - Similar hybrid pattern

- [ ] `app/finance/transfers/page.tsx`
  - Keep GraphQL hooks for mutations

#### 4.4 Form Pages (Client Components)

Keep these as Client Components:

- [ ] `app/finance/backup/page.tsx` (BackupRestore component)
- [ ] Medical expense forms (complex state management)
- [ ] Import functionality

#### 4.5 API Routes → Route Handlers

Migrate API routes to App Router Route Handlers:

```typescript
// app/api/accounts/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Handler logic
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Handler logic
  return NextResponse.json(result);
}
```

- [ ] Migrate local API routes (nhl, nba, nfl, mlb, celsius, fahrenheit, etc.)
- [ ] Update GraphQL proxy route
- [ ] Test nginx routing compatibility
- [ ] Update `localApis` array in middleware

#### 4.6 GraphQL Integration

- [ ] Test GraphQL hooks with App Router
- [ ] Keep existing GraphQL client setup
- [ ] Verify transfer operations work

**Expected Completion**: End of Day 12

---

### **Phase 5: Testing & Refinement** (Days 13-14)

#### 5.1 Comprehensive Testing

- [ ] Run full test suite (97+ test files)
- [ ] Update tests for Server Components
- [ ] Add integration tests for hybrid pages
- [ ] Test all authentication flows
- [ ] Verify all 65 hooks still function correctly

#### 5.2 Performance Optimization

- [ ] Analyze bundle size with `npm run analyze`
- [ ] Optimize Client Component boundaries
- [ ] Add `loading.tsx` for all routes
- [ ] Implement Suspense boundaries

#### 5.3 SEO & Metadata

- [ ] Verify all pages have proper metadata
- [ ] Test OpenGraph tags
- [ ] Validate structured data

#### 5.4 User Acceptance Testing

- [ ] Test all critical user flows
- [ ] Verify finance data operations
- [ ] Test blog reading experience
- [ ] Validate sports data pages

#### 5.5 Documentation

- [ ] Update CLAUDE.md with App Router patterns
- [ ] Document new data fetching patterns
- [ ] Update component usage examples
- [ ] Create troubleshooting guide

**Expected Completion**: End of Day 14

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

| Phase                             | Days       | Key Deliverables                                                  |
| --------------------------------- | ---------- | ----------------------------------------------------------------- |
| **Phase 1**: Foundation           | Days 1-2   | App directory setup, middleware migration, testing infrastructure |
| **Phase 2**: Simple Pages         | Days 3-5   | Home, blog, sports pages migrated                                 |
| **Phase 3**: Authentication       | Days 6-8   | Login, register, protected routes                                 |
| **Phase 4**: Finance Pages        | Days 9-12  | All finance functionality migrated                                |
| **Phase 5**: Testing & Refinement | Days 13-14 | Full test suite, optimization, documentation                      |

**Total Duration**: 14 days (2 weeks)

### Daily Checklist Template

- [ ] Morning: Review previous day's work
- [ ] Execute planned migration tasks
- [ ] Run affected tests
- [ ] Document any blockers or deviations
- [ ] Evening: Verify migrated routes work in production build
- [ ] Update this plan with actual progress

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

| Date       | Decision                         | Reasoning                                        |
| ---------- | -------------------------------- | ------------------------------------------------ |
| 2025-10-27 | Incremental migration            | Safer, allows testing at each step               |
| 2025-10-27 | Server Components (RSC) strategy | Leverage App Router benefits, better performance |
| 2025-10-27 | Start with simple pages          | Validate approach before complex finance pages   |
| 2025-10-27 | Case-by-case hook evaluation     | Balance between modernization and pragmatism     |

### Open Questions

- [ ] Should we use Server Actions for forms or stick with API routes?
- [ ] Do we want to enable Partial Prerendering (experimental)?
- [ ] Should GraphQL operations move server-side where possible?
- [ ] Do we need to update TypeScript configuration for App Router?

---

## Contact & Support

**Migration Lead**: [Your Name]
**Technical Issues**: Review this plan and CLAUDE.md
**Questions**: Add to "Open Questions" section above

---

**Last Updated**: 2025-10-27
**Next Review**: After Phase 2 completion (Day 5)
