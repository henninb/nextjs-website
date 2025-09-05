# CLAUDE.md - NextJS Website Repository Guide

## Build and Development Commands

- `npm run dev` - Start development server (with NODE_OPTIONS='--no-deprecation' for cleaner output)
- `npm run dev:turbo` - Start development server with Turbo mode
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prettier` - Format code with Prettier
- `npm run prettier:check` - Check code formatting with Prettier
- `npm test` - Run Jest tests
- `npm test -- -t "test name"` - Run specific test
- `npm test -- --testPathPattern=path/to/test` - Run tests in specific path
- `npm run pages:build` - Build for Cloudflare Pages deployment
- `npm run analyze` - Analyze bundle size with webpack-bundle-analyzer

## Jest Testing

Jest is configured with:

- **Test Environment**: jsdom for React component testing
- **SWC**: Fast transpilation for TypeScript/JSX (@swc/jest@0.2.39)
- **Testing Library**: React Testing Library (@testing-library/react@16.3.0)
- **MSW**: Mock Service Worker v2.10.5 configured with public worker directory
- **TypeScript Support**: Full support for .ts, .tsx files with SWC transform
- **Module Aliases**: Configured for @/components, @/pages, @/styles paths
- **Coverage**: Comprehensive coverage collection excluding node_modules, .next, and config files

### Test Examples by Category:

**Hook Tests (48+ hooks):**

- Finance data hooks: useAccountFetch, usePaymentInsert, useTransactionDelete, useTotalsFetch
- User management: useUser, useLoginProcess, useUserAccountRegister
- CRUD operations: useCategoryFetch, useDescriptionDelete, useParameterUpdate
- GraphQL hooks: useAccountFetchGql, useTransferFetchGql, useTransferInsertGql
- Validation: useValidationAmountFetch, useFinanceValidation
- Sports data: useSportsData
- Specialized: useAccountUsageTracking, usePendingTransaction\* hooks

**Component Tests:**

- Core components: Layout, AuthProvider, DataGridDynamic, ErrorBoundary
- Finance-specific: USDAmountInput, BackupRestore, SelectNavigateAccounts
- UI components: EmptyState, LoadingState, Spinner

**Page Tests:**

- Finance pages: categories, payments, transactions, transfers, backup
- Authentication: login, register
- Import functionality and integration tests
- Accessibility tests

**Integration Tests:**

- Payment cascade operations
- Transaction state updates
- Account management workflows

MSW is fully configured for API mocking with worker in public/ directory.

## Code Style Guidelines

- **TypeScript**: Use TypeScript for type safety (`strict: false` in tsconfig.json)
- **Target**: ES2017 with modern features
- **Imports**: Group external packages first, then local modules
- **Components**: Functional components with TypeScript interfaces for props
- **Naming Conventions**:
  - React components: PascalCase
  - Hooks: camelCase with 'use' prefix
  - Interfaces/Types: PascalCase
  - Files: camelCase for utilities, PascalCase for components
- **Error Handling**: Use try/catch with specific error messages and logging
- **State Management**:
  - Server state: React Query (@tanstack/react-query@5.85.5)
  - Client state: React hooks
  - GraphQL: Custom GraphQL client integration
- **Theming**: MUI theming system with draculaTheme and modernTheme
- **Security**: Comprehensive validation, sanitization, and CORS middleware

## Project Structure

### Core Directories:

- `/components`: 20+ reusable UI components (Layout, DataGrid, Auth, etc.)
- `/hooks`: 48+ custom React hooks for data fetching/mutations
- `/model`: TypeScript interfaces and types for data models (20+ models)
- `/pages`: Next.js pages and API routes with finance, blog, and utility pages
- `/contexts`: React contexts (UIContext for theme and state management)
- `/layouts`: Page layout components (FinanceLayout)
- `/themes`: MUI theme configurations (draculaTheme, modernTheme)
- `/utils`: Utility functions including security, validation, and global setup

### Testing:

- `/__tests__`: Comprehensive Jest test suite (100+ test files)
  - `/hooks`: Hook testing with isolated and integration tests
  - `/components`: Component testing with React Testing Library
  - `/pages`: Page and API route testing
  - `/contexts`: Context provider testing
- `/__mocks__`: Mock implementations for MUI, jose, and other dependencies
- `/data`: Test data and dummy data files for comprehensive testing scenarios

### Configuration:

- **Node.js**: Supports versions 20.x, 22.x, 23.x, 24.x
- **React**: Version 19.1.1
- **Next.js**: Version 15.5.0
- **TypeScript**: Version 5.9.2 configured with relaxed strict mode
- **Dependencies**: Modern stack with Emotion, MUI v7, Zod v4, date-fns v4

### Additional Features:

- **GraphQL Integration**: Custom GraphQL client with transfer operations
- **Security**: Comprehensive security utilities including CORS, CSP reporting, secure UUID
- **Blog System**: MDX-based blog with gray-matter processing
- **Sports Data**: NFL, NBA, MLB, NHL data integration
- **Validation**: Zod-based schema validation and sanitization
- **File Management**: Image handling, receipt processing
- **DevOps**: Docker, AWS, GCP deployment configurations

## Middleware Configuration

- **Runtime**: Keep `experimental-edge` runtime in middleware.js - DO NOT change to standard `edge` runtime
- The experimental-edge runtime is intentionally used for specific functionality requirements
- Security middleware includes CORS handling and CSP reporting

## Nginx Reverse Proxy Configuration

**IMPORTANT**: The domains `vercel.bhenning.com` and `www.bhenning.com` are behind an nginx reverse proxy at `~/projects/github.com/henninb/nginx-reverse-proxy/nginx.conf`.

### Local API Routing Issue

**Problem**: Nginx was intercepting ALL `/api/*` requests and routing them to the local finance service instead of allowing Next.js local APIs to pass through to Vercel.

**Solution Applied**: Added specific location blocks for local APIs that must come BEFORE the general `/api/` block in nginx.conf:

```nginx
# Local Next.js APIs - pass through to Vercel (must come before general /api/ block)
location ~ ^/api/(nhl|nba|nfl|mlb|celsius|fahrenheit|lead|player-ads|player-analytics|player-heartbeat|player-metadata|weather|uuid|human)(/.*)?$ {
    proxy_pass https://nextjs-website-alpha-weld.vercel.app$request_uri;
    proxy_set_header Host nextjs-website-alpha-weld.vercel.app;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_ssl_server_name on;
    proxy_ssl_name nextjs-website-alpha-weld.vercel.app;
}
```

### Current API Routing Flow

1. **Local Next.js APIs**: `/api/nhl`, `/api/nba`, `/api/nfl`, `/api/mlb`, `/api/celsius`, `/api/fahrenheit`, `/api/lead`, `/api/player-ads`, `/api/player-analytics`, `/api/player-heartbeat`, `/api/player-metadata`, `/api/weather`, `/api/uuid`, `/api/human` → Vercel platform
2. **GraphQL**: `/api/graphql` → Local finance service `/graphql`
3. **Finance APIs**: All other `/api/*` → Local finance service

### Key Points

- **Nginx location precedence**: Most specific regex locations must come before general ones
- **Middleware bypass**: The Next.js middleware correctly identifies and bypasses security for local APIs
- **No breaking changes**: Finance API routing remains intact
- **Testing**: Changes applied to both `vercel.bhenning.com` and `www.bhenning.com` server blocks

### Adding New Local APIs

When adding new Next.js API routes that should bypass the finance service:

1. Add the route to the nginx regex pattern in both `vercel.bhenning.com` and `www.bhenning.com` server blocks
2. Add the route to the `localApis` array in `middleware.js`
3. Test both development and production environments
