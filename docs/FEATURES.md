# Features

Maintained by the **documentation** subagent. One row per feature.

| ID | Title | State | Owner | Plan | Review | Security | QA | PR |
|----|-------|-------|-------|------|--------|----------|----|----|
| FEAT-20260513-01 | Design System & UI Standards — dark mode fixes, responsive layout, form alignment, icon visibility | Shipping | elsonveliu | [PLAN.md](.features/FEAT-20260513-01/PLAN.md) | [REVIEW.md](.features/FEAT-20260513-01/REVIEW.md) | [SECURITY.md](.features/FEAT-20260513-01/SECURITY.md) | [QA.md](.features/FEAT-20260513-01/QA.md) | — |
| FEAT-20260512-03 | Dashboard and core UI modernization | Shipping | elsonveliu | [PLAN.md](.features/FEAT-20260512-03/PLAN.md) | [REVIEW.md](.features/FEAT-20260512-03/REVIEW.md) | [SECURITY.md](.features/FEAT-20260512-03/SECURITY.md) | [QA.md](.features/FEAT-20260512-03/QA.md) | — |
| FEAT-20260512-02 | Authentication modernization | Shipping | elsonveliu | [PLAN.md](.features/FEAT-20260512-02/PLAN.md) | [REVIEW.md](.features/FEAT-20260512-02/REVIEW.md) | [SECURITY.md](.features/FEAT-20260512-02/SECURITY.md) | [QA.md](.features/FEAT-20260512-02/QA.md) | — |
| FEAT-20260512-01 | Frontend design system foundation | Shipping | elsonveliu | [PLAN.md](.features/FEAT-20260512-01/PLAN.md) | [REVIEW.md](.features/FEAT-20260512-01/REVIEW.md) | [SECURITY.md](.features/FEAT-20260512-01/SECURITY.md) | [QA.md](.features/FEAT-20260512-01/QA.md) | — |
| FEAT-20260511-01 | Client management (CRUD) | Done | elsonveliu | [PLAN.md](.features/FEAT-20260511-01/PLAN.md) | [REVIEW.md](.features/FEAT-20260511-01/REVIEW.md) | [SECURITY.md](.features/FEAT-20260511-01/SECURITY.md) | [QA.md](.features/FEAT-20260511-01/QA.md) | — |

## FEAT-20260513-01 — Design System & UI Standards

### Overview

Frontend-only polish pass that introduces a single, documented design system layered on Tailwind v4 tokens, fixes all four visible dark-mode / alignment / search-clear defects, and enforces token usage via ESLint. No backend or API changes.

### Frontend changes (no backend changes)

- **`src/shared/theme/tokens.ts`** (new) — typed export of `colors`, `space`, `radius`, `font`, `breakpoints`, and `state` token maps.
- **`src/shared/ui/Icon.tsx`** (new) — thin Lucide wrapper enforcing `currentColor` and `aria-hidden`.
- **`src/shared/ui/FormLabel.tsx`** (new) — `<label>` primitive using `text-[var(--color-foreground)]`.
- **`src/shared/ui/FormField.tsx`** (new) — vertical label + control + error slot with `aria-describedby` wiring.
- **Auth forms** (`LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `AuthSplitLayout`, `PasswordField`) migrated to `FormField`; all labels and headings use foreground tokens; eye icons routed through `Icon`.
- **RegisterForm** — `confirmPassword` field now rendered in its own `FormField` row with an independent show/hide toggle (fixes AC-3).
- **ClientsPage** — `Clear` (X icon-button) appears when `search.length > 0`; Escape key handler on the search input; `Reset filters` button resets `search`, `statusFilter`, and `page` (fixes AC-4).
- **ClientForm / ClientTable / ClientStatusBadge / ConfirmDeleteDialog / Toast** — all hard-coded `text-red-*`, `bg-red-*`, `text-foreground`, `text-muted-foreground` literals replaced with CSS token equivalents.
- **Shell components** (`Sidebar`, `TopNav`, `ThemeToggle`, `LanguageSelector`, `AppShell`, `PageContainer`, `PageHeader`) — icons routed through `Icon`; responsive padding and breakpoint classes added.
- **`frontend/eslint.config.mjs`** — seven `no-restricted-syntax` selectors banning raw Tailwind colour utilities inside JSX `className` strings.
- **E2E specs** — four new Playwright suites: `dark-mode-contrast.spec.ts`, `responsive.spec.ts`, `forms-alignment.spec.ts`, `clients/search-clear.spec.ts`.
- **`docs/DESIGN_SYSTEM.md`** — created; covers token map, primitives API, dark mode guide, breakpoints, component states, and ESLint rule.

### Quality gate results

| Gate | Result | Detail |
|------|--------|--------|
| Vitest statements | 97.43 % (gate 95 %) | pass |
| Vitest branches | 91.86 % (gate 90 %) | pass |
| Vitest functions | 97.80 % (gate 95 %) | pass |
| Vitest lines | 97.43 % (gate 95 %) | pass |
| pnpm lint | 0 errors | pass |
| pnpm audit | 0 high / 0 critical | pass (2 pre-existing moderate dev-server-only CVEs) |
| Playwright E2E (feature gate) | 120 / 120 passed | pass |
| Grype JAR | 0 HIGH / 0 CRITICAL | pass — CVE-2024-47554 absent, commons-io 2.17.0 confirmed |
| gitleaks | 0 secrets | pass |
| Semgrep | 0 findings | pass (false positive in LibreOfficePdfConverter.java suppressed with nosemgrep) |

### Known non-blocking recommendations (from Review iteration 2)

| Item | Description |
|------|-------------|
| Icon.tsx | `cn(sizes[size], className)` does not prepend `text-[currentColor]` as base class |
| AuthSplitLayout.tsx | Form panel container lacks `text-[var(--color-foreground)]` |
| input.tsx | `bg-transparent` retained; browser autofill in dark mode may override with white |
| index.css | `color-scheme: light dark` not declared on `:root` and `.dark` |
| TopNav.tsx | `data-testid="hamburger"` should match Playwright spec (`mobile-menu-trigger`) |
| PasswordField.tsx | Eye/EyeOff still use direct Lucide imports; should convert to `<Icon>` |
| ClientStatusBadge.tsx | `bg-green-100 text-green-800` hard-coded; should migrate to token equivalents |

---

## FEAT-20260512-03 — Dashboard and core UI modernization

### Overview

Full SaaS shell retrofit onto the existing React SPA. Delivers a collapsible sidebar, top navigation bar, Dashboard KPI page, and a completely redesigned Clients module — all built on the FEAT-20260512-01 design system primitives without any backend changes.

### Frontend changes (no backend changes)

- **AppShell** (`src/shared/components/AppShell.tsx`) — responsive grid composing `Sidebar` + `TopNav` + `<Outlet/>`. On `<md` the sidebar collapses into a shadcn `Sheet` drawer opened by the hamburger button.
- **Sidebar** — collapsible desktop sidebar with Dashboard, Clients, and Invoices-disabled nav items; Lucide icons; `aria-current="page"` active state from `useLocation`; uses `useUiStore().sidebarCollapsed` (FEAT-01).
- **MobileSidebar** — shadcn `Sheet` wrapper rendering the same nav items; closes on nav click.
- **TopNav** — hamburger (mobile), breadcrumbs, `UserMenu` (`Avatar` + `DropdownMenu` with logout), `ThemeToggle` (FEAT-01), `LanguageSelector` (FEAT-01).
- **DashboardPage** at `/` — three KPI `Card`s: Total Clients (`totalElements` from `GET /api/v1/clients?size=1`), Active Clients (same value until backend exposes a status field), Invoices (0); `RecentActivity` stub section; `Skeleton` loading states; error state with retry.
- **ClientsPage** at `/clients` — shadcn `Table` (Name, Email, Phone, Status, Updated, Actions); server-side search via `query` param; client-side status filter (All / Active / Inactive) via `deriveStatus()`; client-side pagination; `Skeleton` rows while loading; `EmptyState` with CTA when `totalElements === 0`.
- **ClientFormSheet** — slide-in shadcn `Sheet` containing `ClientForm`; replaces the old `ClientFormModal` (Dialog). `ClientForm` migrated to `react-hook-form` + `zodResolver`.
- **ConfirmDeleteDialog** — migrated to shadcn `AlertDialog`; same prop signature retained.
- **ClientDetailPage** at `/clients/:id` — `Card` layout with contact info, status `Badge`, `createdAt`/`updatedAt`, Edit + Delete actions.
- **ClientStatusBadge** — maps derived `ACTIVE`/`INACTIVE` status to a coloured `Badge`.
- **derive.ts** — pure helpers `deriveStatus(client)` (defaults to `ACTIVE` until backend exposes the field) and `formatDate(iso)`.
- **PageTransition** — Framer Motion `motion.div` with fade+slide variants; `AnimatePresence` on the route outlet.
- **i18n** — all new user-visible strings loaded via `useTranslation`; new keys under `nav.*`, `topnav.*`, `dashboard.*`, `clients.*`, `clientDetail.*`, `common.*` in `en.json`.
- **Responsive breakpoints**: 360 px (mobile drawer), 768 px (collapsed icon sidebar), 1280 px+ (full labelled sidebar).
- **New deps**: `framer-motion ^11`, `lucide-react ^0.460`, `react-i18next ^15`, `i18next ^24`, `react-hook-form ^7.53`, `@hookform/resolvers ^3.9`.
- **Deleted**: `ClientFormModal.tsx` (replaced by `ClientFormSheet`).
- **Layout path change**: layout components reside in `src/shared/components/` (project convention) rather than `src/shared/layout/` as planned.

### Quality gate results

| Gate | Result | Detail |
|------|--------|--------|
| Vitest statements | 96.72 % (gate 95 %) | pass |
| Vitest branches | 91.76 % (gate 90 %) | pass |
| Vitest functions | 96.45 % (gate 95 %) | pass |
| Vitest lines | 96.72 % (gate 95 %) | pass |
| pnpm lint | 0 errors | pass (3 pre-existing warnings in shadcn vendor files) |
| pnpm audit | 0 high / 0 critical | pass (2 pre-existing moderate CVEs) |
| Playwright E2E | 56 / 56 passed | pass |

### Known v1 limitations / tracked risks

| Risk | Description | Plan |
|------|-------------|------|
| R-4 | `AnimatePresence` on route outlet and staggered `motion.tr` table rows not fully wired (non-blocking reviewer finding) | Wire in follow-up or FEAT-20260512-03 patch |
| R-5 | Breadcrumbs component not created; TopNav renders route title via other means (non-blocking reviewer finding) | Add `Breadcrumbs.tsx` in follow-up |
| R-6 | `ConfirmDeleteDialog` and `ClientStatusBadge` still have some hard-coded English strings instead of i18n keys (non-blocking; keys exist in `en.json`) | One-liner swap in follow-up |
| R-7 | `ClientDetailPage` file-level statement coverage 82.8 % (aggregate gate passes) | Add tests for phone/address conditional branches in follow-up |

---

## FEAT-20260512-02 — Authentication modernization

### Overview

Full end-to-end authentication layer covering email/password and Google OAuth sign-in.

### Backend changes

- **New endpoints** (all public, no auth required):
  - `POST /api/v1/auth/login` — verifies credentials against `app_users` (bcrypt); returns `{ email, displayName }`.
  - `POST /api/v1/auth/register` — creates a new `AppUser` with hashed password; returns `201 { email, displayName }`. Returns `409` on duplicate email (`USER_EMAIL_TAKEN`).
  - `POST /api/v1/auth/forgot-password` — always returns `204 No Content` (anti-enumeration; email not yet sent — see R-3).
- **New domain objects**: `AppUser` record, `AppUserRepository` port, `AppUserRepositoryAdapter` JPA adapter, `AppUserEntity`.
- **New table**: `app_users` via Flyway `V3__create_app_users.sql`. Partial unique index on `lower(email) WHERE deleted_at IS NULL`.
- **`SecurityConfig`** updated: `/api/v1/auth/**` permitted without credentials; `BCryptPasswordEncoder` bean added; `UserDetailsService` backed by `AppUserRepository`.

### Frontend changes

- **Pages**: `LoginPage`, `RegisterPage`, `ForgotPasswordPage` — split-panel layout (brand left, form right on `md+`; stacked on mobile).
- **Auth store**: `useAuthStore` (Zustand) — actions: `login`, `loginWithGoogle`, `register`, `forgotPassword`, `logout`, `hydrate`. Session persisted to `localStorage` key `auth.session`.
- **Route guards**: `ProtectedRoute` (unauthenticated → `/login`), `PublicOnlyRoute` (authenticated → `/`).
- **Google OAuth**: Firebase `signInWithPopup(GoogleAuthProvider)` — stores `{ email, displayName, photoURL, provider:'google', idToken }`.
- **Zod schemas**: `loginSchema`, `registerSchema`, `forgotPasswordSchema`.
- **HTTP layer**: `authApi` module; `http.ts` attaches `Authorization: Basic` when a session is present; 401 triggers `logout()`.
- **i18n**: all strings under `auth.*` namespace in `en.json`.

### Known v1 limitations (tracked risks)

| Risk | Description | Plan |
|------|-------------|------|
| R-1 | `localStorage` Basic token is XSS-readable | Accept for v1; migrate to httpOnly session cookie in `FEAT-auth-cookies` |
| R-2 | Google-only users have no Basic credential — backend calls return 401 | Accept for v1; add BE OIDC token verifier in follow-up |
| R-3 | Password-reset email is not sent — `requestPasswordReset` logs and returns 204 | Wire SMTP / transactional email in follow-up |
