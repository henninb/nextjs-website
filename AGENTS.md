# Repository Guidelines

This document helps contributors work effectively in this Next.js repository. Follow the structure, commands, and conventions below to keep changes consistent and easy to review.

## Project Structure & Module Organization
- `pages/`: Next.js routes (e.g., `pages/index.tsx`, `pages/accounts/[id].tsx`).
- `components/`: Reusable UI components (PascalCase, e.g., `components/UserCard.tsx`).
- `hooks/`, `contexts/`: Custom hooks (`useXxx`) and providers.
- `utils/`: Shared helpers (camelCase, e.g., `utils/formatCurrency.ts`).
- `model/`, `data/`: Domain models and static/content data.
- `public/`: Static assets served at `/` (e.g., `/logo.png`).
- `styles/`, `themes/`, `layouts/`: Styling, themes, layout wrappers.
- `__tests__/`, `__mocks__/`: Tests and doubles. Key configs: `jest.config.js`, `jest.setup.js`, `tsconfig.json`, `next.config.mjs`.
- Path aliases supported (e.g., `@/components/Button`).

## Build, Test, and Development Commands
- `npm run dev`: Start Next.js dev server (http://localhost:3000).
- `npm run dev:turbo`: Dev with Next Turbo mode.
- `npm run build`: Production build to `.next/`.
- `npm start`: Serve the built app.
- `npm test`: Run Jest + Testing Library.
- `npm run analyze`: Build with bundle analyzer.
- `npm run pages:build`: Build for Cloudflare Pages.
- `npm run prettier`: Format the codebase.

## Coding Style & Naming Conventions
- Language: TypeScript preferred; use `.tsx` for React components.
- Formatting: Prettier. Run `npm run prettier` before committing.
- Components: PascalCase. Hooks: `useXxx` in `hooks/` with camelCase.
- Utilities: camelCase in `utils/`. Routes mirror URLs under `pages/`.
- Imports: prefer aliases like `@/components/Button`.

## Testing Guidelines
- Stack: Jest (jsdom) + `@testing-library/react`; MSW available for API mocking.
- Location/Names: `__tests__/` or co-located `*.test.ts(x)` / `*.spec.ts(x)`.
- Example: `npx jest __tests__/account.test.tsx -t "renders owner"`.
- Coverage: collected via `jest.config.js` (no hard threshold). Focus on unit tests for utils/hooks and interaction tests for components.

## Commit & Pull Request Guidelines
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`). Imperative, concise subject (≤72 chars); add scope when helpful (`feat(auth): ...`).
- PRs: clear description, linked issues, screenshots for UI, test notes, and verification steps. Keep changes focused and incremental.

## Security & Configuration Tips
- Secrets/config: use `.env.local` (do not commit). See `SECURITY.md`.
- Be cautious editing `middleware.js` and auth/headers; run `npm test` and verify affected routes.
