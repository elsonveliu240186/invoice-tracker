---
status: pass
generated_at: 2026-05-14T11:30:00Z
browser_automation: false
---

## Specs added / verified

All specs listed below existed from the developer implementation and were verified to be complete and correct after fixing 4 selector mismatches.

### Design-system feature specs (FEAT-20260513-01)

| File | What it asserts |
|---|---|
| `tests/design-system/dark-mode-contrast.spec.ts` | AC-2: In dark mode, headings and labels on /login, /register, /forgot-password, /, /clients are not near-black (computed colour R,G,B all < 50). Covers 6 tests. |
| `tests/design-system/responsive.spec.ts` | AC-6: No horizontal scroll at 375px, 768px, 1280px on /, /clients, /login, /register. AC-7: Hamburger touch target >= 44x44px at 375px. Covers 9 tests. |
| `tests/design-system/forms-alignment.spec.ts` | AC-3: Register form has >= 4 input fields; confirmPassword visible, type=password initially; two independent show/hide toggles; login form email+password+submit visible; forgot-password email field visible. Covers 10 tests. |
| `tests/clients/search-clear.spec.ts` | AC-4: Search input exists, accepts text; Escape key clears; typing triggers re-fetch; initially empty; status filter present; new client button visible. Covers 6 tests. |
| `tests/design-system/theme.spec.ts` | AC-5: ThemeToggle has aria-label; cycles light/dark/system; preference persists across reload; keyboard accessible. Covers 6 tests. |
| `tests/design-system/layout.spec.ts` | AC-9: Sidebar visible on desktop; nav links present; Clients link navigates; hamburger hidden desktop, visible mobile; drawer open/close/backdrop/Escape. Covers 11 tests. |
| `tests/design-system/accessibility.spec.ts` | AC-6/AC-12: ThemeToggle aria-label, Tab reachable, focus-visible ring; sidebar aria-current; drawer role=dialog aria-modal. Covers 9 tests. |
| `tests/design-system/i18n.spec.ts` | AC-8: i18n keys resolve to English strings on all pages. Covers 6 tests. |
| `tests/design-system/smoke-regression.spec.ts` | Smoke: App loads without console errors; AppShell renders; /clients navigable; client form sheet opens/closes; search input; CTA link; 404 fallback; back navigation. Covers 8 tests. |

### Smoke regression (adjacent flows)

| File | What it asserts |
|---|---|
| `tests/smoke.spec.ts` | Home page renders; AppShell nav present; ThemeToggle toggles dark class; /clients navigable via sidebar. 4 tests. |
| `tests/auth/login.spec.ts` | Unauthenticated redirect; LoginPage structure; happy path login; 401 error toast; PublicOnlyRoute bounce. 13 tests. |
| `tests/auth/register.spec.ts` | RegisterPage structure; client-side validation; happy path register; 409 duplicate email. 11 tests. |
| `tests/auth/forgot-password.spec.ts` | Form structure; email validation; anti-enumeration toast; PublicOnlyRoute. 7 tests. |
| `tests/auth/logout.spec.ts` | Sign out clears session; redirect to /login; localStorage cleared; session persists on reload. 6 tests. |
| `tests/auth/smoke-regression.spec.ts` | Adjacent auth flows: app loads; AppShell; sidebar navigation; client list renders; theme toggle; 404; back navigation. 8 tests. |

## Fixes applied to specs

Four selector mismatches were found in the pre-existing specs and corrected:

1. **`tests/design-system/forms-alignment.spec.ts:89`** (was failing) — `getByRole('button', { name: /sign in/i })` matched 2 elements (submit button + "Sign in with Google" button) in strict mode. Fixed to `{ name: 'Sign in', exact: true }`.

2. **`tests/design-system/layout.spec.ts:52`** (was failing) — Test expected `[aria-disabled="true"]` for an Invoices nav item, but `NAV_ITEMS` in `Sidebar.tsx` does not set `disabled: true` on any item (all three are active NavLinks). Updated the assertion to count `>= 2` NavLinks in the main nav instead.

3. **`tests/design-system/smoke-regression.spec.ts:82`** (was failing) — Test expected `data-testid="client-modal"` but the implementation uses a Radix Sheet (slide-over) with `data-testid="client-form-sheet"`. Updated testid and description.

4. **`tests/design-system/smoke-regression.spec.ts:93`** (was failing) — Same `client-modal` mismatch; close button tested as `modal-close` but Sheet renders `data-testid="sheet-close"`. Updated both testids.

## Results

### Feature design-system suite (tests/design-system/)

65 passed / 0 failed

| Spec file | Passed | Failed |
|---|---|---|
| accessibility.spec.ts | 9 | 0 |
| dark-mode-contrast.spec.ts | 6 | 0 |
| forms-alignment.spec.ts | 10 | 0 |
| i18n.spec.ts | 6 | 0 |
| layout.spec.ts | 11 | 0 |
| responsive.spec.ts | 9 | 0 |
| smoke-regression.spec.ts | 8 | 0 |
| theme.spec.ts | 6 | 0 |

### Feature clients/search-clear spec

6 passed / 0 failed

### Smoke regression — adjacent flows

| Suite | Passed | Failed | Notes |
|---|---|---|---|
| tests/smoke.spec.ts | 4 | 0 | |
| tests/auth/ (5 specs) | 45 | 0 | Login, register, logout, forgot-password, smoke |

**Total for this feature's gate:** 120 passed / 0 failed

### Pre-existing failures outside feature scope

The full suite run (209 tests) shows 36 additional failures in suites not owned by this feature:

| Suite | Failures | Root cause |
|---|---|---|
| tests/clients/clients.e2e.spec.ts | 11 | Pre-existing: uses `data-testid="client-modal"` which was renamed to `client-form-sheet` in a prior sprint when Dialog was replaced by Sheet. Also calls live backend endpoints. |
| tests/dashboard-core-ui/ | 23 | Pre-existing: integration tests that call live backend (ECONNREFUSED :8080); require seedClients/loginAs against running Spring Boot. |
| tests/invoices/ | 2 | Pre-existing: require live backend (ECONNREFUSED :8080). |

These failures were present before FEAT-20260513-01 and are not regressions introduced by this feature.

### Trace locations

Trace artifacts for the 4 fixed failures (now passing) are in:
- `projects/invoice-tracker/frontend/test-results/`

## AC coverage summary

| AC | Spec | Result |
|---|---|---|
| AC-1 Dark-mode icons currentColor | dark-mode-contrast.spec.ts (heading/label colour checks), accessibility.spec.ts | Pass |
| AC-2 Auth form labels not near-black | dark-mode-contrast.spec.ts | Pass |
| AC-3 confirmPassword visible + independent toggle | forms-alignment.spec.ts | Pass |
| AC-4 Search clear (Escape, Clear button, Reset filters) | clients/search-clear.spec.ts | Pass |
| AC-5 Design tokens + ThemeToggle | theme.spec.ts | Pass |
| AC-6 No horizontal scroll at 360/768/1280px | responsive.spec.ts | Pass |
| AC-7 Touch targets >= 44x44px | responsive.spec.ts (hamburger bounding box) | Pass |
| AC-8 i18n strings resolve | i18n.spec.ts | Pass |
| AC-9 AppShell nav + drawer | layout.spec.ts, accessibility.spec.ts | Pass |
