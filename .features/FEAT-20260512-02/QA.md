---
status: pass
generated_at: 2026-05-12T21:45:00Z
browser_automation: false
---

## Specs added

- `tests/auth/login.spec.ts` — AC-1 (unauthenticated redirect to /login), AC-2 (PublicOnlyRoute redirects authenticated users), AC-3 (LoginPage structure: email field, password field, submit button, register link, forgot-password link), AC-4 (happy path: POST /api/v1/auth/login 200 → redirect to /, toast success; 401 → error toast stays on /login)
- `tests/auth/register.spec.ts` — AC-6 (RegisterPage structure, field validation: blank displayName, invalid email, weak password, no digit, passwords mismatch; happy path: 201 → redirect to /; 409 conflict → error toast), AC-2 (PublicOnlyRoute)
- `tests/auth/forgot-password.spec.ts` — AC-7 (ForgotPasswordPage structure, blank email validation, anti-enumeration: same "if that email is registered" toast for both 204 success and 500 error), AC-2 (PublicOnlyRoute)
- `tests/auth/logout.spec.ts` — AC-11 (sign-out button clears it.auth from localStorage, redirects to /login; client-side navigation after logout is blocked and redirects to /login), AC-12 (session persists across full page reload when localStorage is seeded)
- `tests/auth/smoke-regression.spec.ts` — adjacent flows after successful login: home page renders, /clients navigation works, ThemeToggle visible and functional, 404 route renders not-found, back navigation from /clients to / works

## Pre-existing specs updated (auth guard compatibility)

All pre-existing specs were updated to seed an authenticated session via `page.addInitScript()` before each test:

- `tests/smoke.spec.ts` — added `seedAuth` + `stubClients` helpers, `beforeEach` seeding
- `tests/clients/clients.e2e.spec.ts` — added global `beforeEach` seeding; also fixed a pre-existing React StrictMode double-invocation bug in the delete test (call counter → boolean flag)
- `tests/design-system/accessibility.spec.ts` — added `seedAuth` + `beforeEach` to both viewport describe blocks
- `tests/design-system/i18n.spec.ts` — added `seedAuth` + `stubClients` helpers, `beforeEach` seeding
- `tests/design-system/layout.spec.ts` — added `seedAuth` + `stubClients` helpers, `beforeEach` seeding
- `tests/design-system/smoke-regression.spec.ts` — added `seedAuth` + `stubClients` helpers, `beforeEach` seeding
- `tests/design-system/theme.spec.ts` — added `seedAuth` helper, `beforeEach` seeding in both describe blocks

## Results

- `tests/auth/login.spec.ts`: 13 passed / 0 failed
- `tests/auth/register.spec.ts`: 11 passed / 0 failed
- `tests/auth/forgot-password.spec.ts`: 7 passed / 0 failed
- `tests/auth/logout.spec.ts`: 6 passed / 0 failed
- `tests/auth/smoke-regression.spec.ts`: 8 passed / 0 failed
- `tests/smoke.spec.ts`: 4 passed / 0 failed
- `tests/clients/clients.e2e.spec.ts`: 22 passed / 0 failed
- `tests/clients/clients.spec.ts`: 0 passed / 0 failed / 2 skipped (require `BACKEND_AVAILABLE=true` — intentional)
- `tests/design-system/accessibility.spec.ts`: 9 passed / 0 failed
- `tests/design-system/i18n.spec.ts`: 4 passed / 0 failed
- `tests/design-system/layout.spec.ts`: 9 passed / 0 failed
- `tests/design-system/smoke-regression.spec.ts`: 8 passed / 0 failed
- `tests/design-system/theme.spec.ts`: 14 passed / 0 failed

**Total: 115 passed, 2 skipped, 0 failed**

Run command: `BASE_URL=http://localhost:5174 pnpm exec playwright test --reporter=line`

Note: Vite fell back to port 5174 (5173 was occupied). `BASE_URL` was set accordingly.

Traces: `projects/invoice-tracker/frontend/test-results/`

## Notable findings

- **React StrictMode double-invocation bug (pre-existing, fixed)**: The `confirms delete` test in `clients.e2e.spec.ts` used a call counter to alternate mock responses. React StrictMode fires `useEffect` twice in dev, causing the list API to be called twice on mount. Switched to a boolean `deleted` flag — mock returns `[ACME]` until delete fires, then returns `[]`.

- **`addInitScript` re-runs on every `page.goto()`**: The logout post-navigation guard test required client-side navigation (`window.history.pushState` + `PopStateEvent`) instead of `page.goto()` to avoid re-seeding localStorage after logout had cleared it.

- **Anti-enumeration pattern verified**: ForgotPassword returns identical toast text regardless of whether the backend returns 204 or 500, preventing email enumeration.
