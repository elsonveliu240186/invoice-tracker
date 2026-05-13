# Changelog

All notable changes to this project will be documented in this file. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Scaffolded from the agenticai framework.
- **Dashboard and core UI modernization** (FEAT-20260512-03) — _no breaking changes_:
  full SaaS shell retrofit over the existing React SPA. New `AppShell` component composes a
  collapsible desktop `Sidebar` (Dashboard, Clients, Invoices-disabled nav items with Lucide icons
  and active-state from `useLocation`) with a shadcn `Sheet` drawer for mobile (`<md`). `TopNav`
  renders a hamburger button on mobile, breadcrumbs derived from the current route, a `UserMenu`
  (`Avatar` + `DropdownMenu` with logout calling `useAuthStore.logout()`), `ThemeToggle`, and
  `LanguageSelector`. `DashboardPage` at `/` shows three KPI `Card`s — Total Clients (real
  `totalElements` from `GET /api/v1/clients?size=1`), Active Clients (same count until backend
  exposes a status field), and Invoices (hardcoded `0`) — plus a `RecentActivity` stub section.
  `ClientsPage` rebuilt with shadcn `Table` (Name, Email, Phone, Status, Updated, Actions columns),
  server-side search via `query` param, client-side status filter (All / Active / Inactive) backed
  by `deriveStatus()` helper, and client-side pagination. `ClientFormModal` replaced by
  `ClientFormSheet` (slide-in shadcn `Sheet`); `ClientForm` migrated to `react-hook-form` +
  `zodResolver`. `ConfirmDeleteDialog` migrated to shadcn `AlertDialog`. New `ClientDetailPage`
  at `/clients/:id` renders a `Card` with contact info, status `Badge`, timestamps, and
  Edit/Delete actions. `ClientStatusBadge` maps derived status to a coloured `Badge`. Pure
  `derive.ts` helpers (`deriveStatus`, `formatDate`) are separated for testability. `PageTransition`
  wraps routes in a Framer Motion `motion.div`; `AnimatePresence` is wired on the route outlet.
  All user-visible strings ported to `react-i18next` (`useTranslation`) with new i18n keys under
  `nav.*`, `topnav.*`, `dashboard.*`, `clients.*`, `clientDetail.*`, and `common.*` namespaces in
  `en.json`. `EmptyState` CTA shown when `totalElements === 0`. `Skeleton` placeholders cover every
  async loading state. Layout is responsive at 360 px (mobile drawer), 768 px (collapsed icon
  sidebar), and 1280 px+ (full labelled sidebar). No backend or API changes. New deps: `framer-motion
  ^11`, `lucide-react ^0.460`, `react-i18next ^15`, `i18next ^24`, `react-hook-form ^7.53`,
  `@hookform/resolvers ^3.9`. Frontend Vitest 96.72 % statements / 91.76 % branches / 96.45 %
  functions / 96.72 % lines (gates 95 / 90 / 95 / 95). 56 Playwright E2E specs across 6 suites,
  all passing. `pnpm lint` 0 errors. `pnpm audit` 0 high/critical.
- **Authentication modernization** (FEAT-20260512-02) — _no breaking changes_: three public auth
  endpoints (`POST /api/v1/auth/login`, `POST /api/v1/auth/register`,
  `POST /api/v1/auth/forgot-password`) added to the backend; Spring Security `SecurityConfig`
  updated to permit `/api/v1/auth/**` without credentials; new `app_users` table via Flyway
  migration `V3__create_app_users.sql` (bcrypt-hashed passwords, partial unique index on
  `lower(email) WHERE deleted_at IS NULL`); `AuthController`, `AuthService`, `AppUser` domain
  record, `AppUserRepository` port, and `AppUserRepositoryAdapter` JPA adapter added. Frontend:
  `LoginPage`, `RegisterPage`, and `ForgotPasswordPage` with split-panel layout and Framer Motion
  fade+slide transitions; `useAuthStore` (Zustand) with `localStorage` persistence and
  session hydration on boot; `ProtectedRoute` and `PublicOnlyRoute` guards; Firebase Google OAuth
  via `signInWithPopup`; Zod schemas (`loginSchema`, `registerSchema`, `forgotPasswordSchema`);
  `authApi` module with MSW mock handlers; `auth.*` i18n namespace; sign-out wired in TopNav.
  Backend JaCoCo 98.7% lines / 100% branches (gate 90%). Frontend Vitest 98.07% statements /
  92.06% branches. Known v1 limitations: `localStorage` Basic token is XSS-readable (R-1);
  Google-only users cannot call protected backend endpoints (R-2); password-reset email not yet
  sent (R-3, tracked).
- **Frontend design system foundation** (FEAT-20260512-01) — _no breaking changes_: Tailwind v4
  CSS-first design tokens (`@theme` block with light/dark scopes), shadcn/ui component primitives
  (Button, Input, Card, Badge, Dialog, Table, Skeleton, Sonner, DropdownMenu, Avatar, Separator)
  under `src/shared/ui/`; Zustand `useThemeStore` with `localStorage` persistence and system-mode
  OS listener; Framer Motion shared variants (`fadeIn`, `slideUp`, `staggerChildren`,
  `pageTransition`) in `src/shared/lib/motion.ts`; react-i18next bootstrapped from
  `src/shared/lib/i18n.ts` with `en.json` covering all new component strings; `AppShell` layout
  with responsive `Sidebar` (Sheet/Dialog drawer at mobile) and `TopNav` (ThemeToggle +
  LanguageSelector + Avatar); shared `PageHeader`, `PageContainer`, `LoadingSpinner`,
  `EmptyState`, `ErrorBoundary`; `ClientsPage`, `ClientFormModal`, and `ConfirmDeleteDialog`
  migrated to semantic design tokens and Radix Dialog primitive; 179 Vitest tests (99.23 % stmts /
  93.47 % branches); 44 Playwright E2E specs across five new design-system suites. Frontend-only;
  no backend or API changes.
- **Client management CRUD** (FEAT-20260511-01) — _no breaking changes_: five REST endpoints
  at `/api/v1/clients` (POST create, GET list with case-insensitive search + pagination capped
  at 100, GET by ID, PUT full-replacement update, DELETE soft-delete); Flyway migration
  `V1__create_clients.sql` with partial unique index on `lower(email) WHERE deleted_at IS NULL`
  and optimistic-lock `version` column; RFC 7807 `ProblemDetail` error bodies; React feature
  slice at `frontend/src/features/clients/` (page, form modal, table, confirm-delete dialog,
  toast); full test pyramid — JaCoCo ≥ 90% (34 backend tests) and Vitest ≥ 95%/90% branch
  (79 frontend tests); 26 Playwright E2E specs; Postman collection updated with all five client
  requests.

[Unreleased]: https://example.com/compare/HEAD...HEAD
