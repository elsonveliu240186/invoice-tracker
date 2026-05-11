# Frontend

Vite + React + TypeScript + Tailwind CSS v4.

## Run locally

```powershell
pnpm install
pnpm dev          # http://localhost:5173 (proxies /api to http://localhost:8080)
```

## Tests

```powershell
pnpm lint
pnpm test:coverage   # Vitest with v8 coverage; gate: 95/95/95/90
pnpm build
pnpm e2e             # Playwright (needs the app running on :5173 in dev, or uses preview in CI)
```

## Conventions

- **Slices** (`src/features/<name>/{ui,model,api}`) for feature work; `src/shared/{ui,lib,api}` only for cross-feature pieces.
- **TypeScript strict** — fix at the source; no `any`, no `@ts-ignore`.
- **Selectors** — use `data-testid` for E2E, semantic queries (`getByRole`, `getByLabel`) for unit tests. Never select by Tailwind class.
- **API** — call backend via `/api/*` (proxied to Spring Boot). MSW handlers under `src/shared/api/mocks/`.
- **Coverage** — `vitest.config.ts` enforces 95 % lines/funcs/stmts and 90 % branches. Don't relax without editing `workflows/QUALITY_GATES.md`.
