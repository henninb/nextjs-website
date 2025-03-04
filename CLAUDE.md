# CLAUDE.md - NextJS Website Repository Guide

## Build and Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run prettier` - Format code with Prettier
- `npm test` - Run Jest tests
- `npm test -- -t "test name"` - Run specific test
- `npm test -- --testPathPattern=path/to/test` - Run tests in specific path

## Jest Testing

Jest tests are configured with:
- SWC for fast transpilation
- Support for TypeScript, TSX files
- React Testing Library for component testing

Currently working test examples:
- Basic JS test: `__tests__/hooks/example.test.js`
- TypeScript test: `__tests__/hooks/basic.test.ts`
- React component test: `__tests__/hooks/component.test.tsx`
- React Hook test: `__tests__/hooks/hook-example.test.tsx`

MSW (Mock Service Worker) for API mocking still needs configuration.

## Code Style Guidelines

- **TypeScript**: Use TypeScript for type safety (`strict: false` in tsconfig)
- **Imports**: Group imports by external packages first, then local modules
- **Components**: Use functional components with TypeScript interfaces for props
- **Naming**:
  - React components: PascalCase
  - Hooks: camelCase with 'use' prefix
  - Interfaces: PascalCase
- **Error Handling**: Use try/catch with specific error messages and logging
- **State Management**: Use React Query for server state, React hooks for UI state
- **Theming**: Use MUI theming system with the draculaTheme

## Project Structure

- `/components`: Reusable UI components
- `/hooks`: Custom React hooks for data fetching/mutations
- `/model`: TypeScript interfaces for data models
- `/pages`: Next.js pages and API routes
