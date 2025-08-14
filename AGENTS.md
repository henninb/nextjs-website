# Repository Guidelines

## Project Structure & Module Organization

- `pages/`: Next.js routes (e.g., `pages/index.tsx`, dynamic routes like `pages/accounts/[id].tsx`).
- `components/`: Reusable UI components (PascalCase files).
- `hooks/`, `contexts/`: Custom hooks and React context providers.
- `utils/`: Shared utilities and helpers.
- `model/`, `data/`: Domain models and static/content data.
- `public/`: Static assets served at root (`/logo.png`).
- `styles/`, `themes/`, `layouts/`: Styling, themes, and layout wrappers.
- `__tests__/`, `__mocks__/`: Tests and test doubles. Key configs: `jest.config.js`, `jest.setup.js`, `tsconfig.json`, `next.config.mjs`.

## Build, Test, and Development Commands

- `npm run dev`: Start Next.js dev server (http://localhost:3000).
- `npm run dev:turbo`: Dev server with Next Turbo mode.
- `npm run build`: Production build; outputs to `.next/`.
- `npm start`: Serve the built app.
- `npm test`: Run Jest + Testing Library.
- `npm run analyze`: Build with bundle analyzer enabled.
- `npm run pages:build`: Build for Cloudflare Pages.
- `npm run prettier`: Format codebase with Prettier.

## Coding Style & Naming Conventions

- Language: TypeScript preferred; use `.tsx` for React components.
- Formatting: Prettier (run `npm run prettier` before committing).
- Components: PascalCase (e.g., `components/UserCard.tsx`). Hooks: `useXxx` camelCase in `hooks/`.
- Utilities: camelCase in `utils/` (e.g., `utils/formatCurrency.ts`).
- Routes: file names mirror URLs in `pages/`.
- Imports: path aliases supported (e.g., `@/components/Button`).

## Testing Guidelines

- Stack: Jest (jsdom) + @testing-library/react; MSW available for API mocking.
- Location/Names: `__tests__/` or co-located `*.test.ts(x)` / `*.spec.ts(x)`.
- Coverage: collected via `jest.config.js` (no hard threshold). Prefer unit tests for utils/hooks and interaction tests for components.
- Examples: `npx jest __tests__/account.test.tsx -t "renders owner"`.

## Commit & Pull Request Guidelines

- Current history is informal (e.g., "wip", "updates"). Adopt Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Commits: imperative, concise subject (≤72 chars); include scope when helpful (`feat(auth): ...`).
- PRs: clear description, linked issues, screenshots for UI, test notes, and verification steps. Keep changes focused.

## Security & Configuration Tips

- Secrets/config: use `.env.local` (do not commit). See `SECURITY.md`.
- Be cautious editing `middleware.js` and auth/headers; run `npm test` and verify affected routes.
