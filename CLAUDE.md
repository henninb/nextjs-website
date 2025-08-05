# CLAUDE.md - NextJS Website Repository Guide

## Build and Development Commands

- `npm run dev` - Start development server (with NODE_OPTIONS='--no-deprecation' for cleaner output)
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prettier` - Format code with Prettier
- `npm test` - Run Jest tests
- `npm test -- -t "test name"` - Run specific test
- `npm test -- --testPathPattern=path/to/test` - Run tests in specific path
- `npm run pages:build` - Build for Cloudflare Pages deployment
- `npm run analyze` - Analyze bundle size with webpack-bundle-analyzer

## Jest Testing

Jest is configured with:

- **Test Environment**: jsdom for React component testing
- **SWC**: Fast transpilation instead of Babel
- **Testing Library**: React Testing Library (@testing-library/react@16.3.0)
- **MSW**: Mock Service Worker v2.10.4 configured with public worker directory
- **TypeScript Support**: Full support for .ts, .tsx files
- **Module Aliases**: Configured for @/components, @/pages, @/styles paths

### Test Examples by Category:

**Hook Tests:**
- Finance hooks: useAccountFetch, usePaymentInsert, useTransactionDelete, etc.
- User hooks: useUser, useLoginProcess
- Category/Description hooks: useCategoryFetch, useDescriptionDelete

**Component Tests:**
- USDAmountInput component test
- Basic React component tests

**Page Tests:**
- Finance pages: categories, payments, transactions, transfers
- Import functionality tests

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
  - Server state: React Query (@tanstack/react-query@5.84.1)
  - Client state: React hooks
  - Also uses SWR for some data fetching
- **Theming**: MUI theming system with draculaTheme and modernTheme

## Project Structure

### Core Directories:
- `/components`: Reusable UI components (Layout, DataGrid, Auth, etc.)
- `/hooks`: Custom React hooks for data fetching/mutations (40+ hooks)
- `/model`: TypeScript interfaces and types for data models
- `/pages`: Next.js pages and API routes
- `/contexts`: React contexts (UIContext)
- `/layouts`: Page layout components (FinanceLayout)
- `/themes`: MUI theme configurations (draculaTheme, modernTheme)

### Testing:
- `/__tests__`: Jest test files organized by type (hooks/, components/, pages/)
- `/__mocks__`: Mock implementations for testing
- `/data`: Test data and dummy data files

### Configuration:
- **Node.js**: Supports versions 20.x, 22.x, 23.x, 24.x
- **React**: Version 19.1.1
- **Next.js**: Version 15.4.5
- **TypeScript**: Configured with relaxed strict mode
