---
status: pass
generated_at: 2026-05-13T14:30:00Z
browser_automation: false
---

## Specs added

- `tests/dashboard-core-ui/auth-helpers.ts` — shared helpers: `loginAs` (injects Zustand auth session via localStorage), `seedClients` (resets backend state via HTTP Basic API)
- `tests/dashboard-core-ui/ac1-ac3-layout.spec.ts` — asserts collapsible sidebar nav items (AC-1), mobile hamburger drawer open/close/Escape (AC-2), TopNav UserMenu avatar + sign-out + hamburger visibility by breakpoint (AC-3)
- `tests/dashboard-core-ui/ac4-dashboard.spec.ts` — asserts Dashboard KPI cards render real `totalElements` from API, Invoices hardcoded 0, RecentActivity section visible, CTA link present, KPI label i18n (AC-4)
- `tests/dashboard-core-ui/ac5-clients-list.spec.ts` — asserts shadcn Table columns, server-side search filter, client-side status filter (INACTIVE returns empty state), pagination controls with 22-client fixture (AC-5)
- `tests/dashboard-core-ui/ac6-ac7-sheet-dialog.spec.ts` — asserts Edit Sheet opens with pre-filled data and submits update, Delete AlertDialog cancel/confirm row removal (AC-6); ClientDetailPage renders contact info, Edit Sheet and Delete AlertDialog, confirm-delete navigates back, unknown ID shows not-found (AC-7)
- `tests/dashboard-core-ui/ac8-ac10-ux.spec.ts` — asserts empty-state when 0 clients, detail-page skeleton resolves (AC-8); i18n label spot-check on clients page (AC-10); responsive layout at 360px / 768px / 1280px breakpoints (AC-11)
- `tests/dashboard-core-ui/smoke.spec.ts` — regression smoke: auth guard redirects unauthenticated users, login page renders, sidebar navigation Dashboard↔Clients, create-client end-to-end through Sheet, client detail URL navigation

## Results

| Suite | Tests | Passed | Failed |
|---|---|---|---|
| ac1-ac3-layout | 10 | 10 | 0 |
| ac4-dashboard | 7 | 7 | 0 |
| ac5-clients-list | 8 | 8 | 0 |
| ac6-ac7-sheet-dialog | 15 | 15 | 0 |
| ac8-ac10-ux | 10 | 10 | 0 |
| smoke | 6 | 6 | 0 |
| **Total** | **56** | **56** | **0** |

Run command: `BASE_URL=http://localhost:5173 pnpm exec playwright test tests/dashboard-core-ui/ --reporter=line`

## Acceptance criteria coverage

| AC | Description | Covered by | Result |
|---|---|---|---|
| AC-1 | Collapsible sidebar with Dashboard / Clients / Invoices (disabled) | ac1-ac3-layout.spec.ts | pass |
| AC-2 | Mobile drawer via hamburger | ac1-ac3-layout.spec.ts | pass |
| AC-3 | TopNav: UserMenu, ThemeToggle, LanguageSelector | ac1-ac3-layout.spec.ts | pass |
| AC-4 | Dashboard KPI cards (real data) + RecentActivity stub | ac4-dashboard.spec.ts | pass |
| AC-5 | Clients Table, search, status filter, pagination | ac5-clients-list.spec.ts | pass |
| AC-6 | Edit Sheet (ClientFormSheet), Delete AlertDialog; no ClientFormModal | ac6-ac7-sheet-dialog.spec.ts | pass |
| AC-7 | ClientDetailPage with Edit + Delete | ac6-ac7-sheet-dialog.spec.ts | pass |
| AC-8 | Skeleton loading state; EmptyState when 0 clients | ac8-ac10-ux.spec.ts | pass |
| AC-9 | Framer Motion AnimatePresence | not E2E testable (animation timing); covered by reviewer non-blocking note | n/a |
| AC-10 | i18n strings via useTranslation | ac8-ac10-ux.spec.ts (spot-check) | pass |
| AC-11 | Responsive at 360 / 768 / 1280px | ac8-ac10-ux.spec.ts | pass |
| AC-12 | Vitest coverage gate | pre-existing reviewer pass (96.72% stmts) | pass |
| AC-13 | pnpm build / lint / audit | pre-existing reviewer pass | pass |

## Notes

- Tests exercise the running Docker stack (backend on :8080, frontend nginx on :5173). All tests run with `workers: 1` (set in `playwright.config.ts`) because they share a real Postgres database and `seedClients` performs full table resets for determinism.
- AC-9 (Framer Motion AnimatePresence on route outlet + table rows) is a non-blocking reviewer finding. Animation presence cannot be reliably asserted in Playwright without artificial delays; the Sheet open/close interactions in AC-6 and AC-7 implicitly exercise the animation surface.
- Auth is bypassed by injecting a synthetic Zustand session into `localStorage` (`it.auth` key) before each navigation, mirroring exactly what the app's `persist` middleware writes on real login.

## Traces

Traces and videos (retained on failure only): `projects/invoice-tracker/frontend/test-results/`
