# Changelog

All notable changes to this project will be documented in this file. Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Versioning: [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Dashboard upgrade — stats, charts, centralized Coolors palette, invoice status, palette switcher** (FEAT-20260514-01) — _no breaking changes_:
  Full dashboard overhaul replacing the placeholder KPI page. Backend: `GET /api/v1/dashboard/stats`
  returns `{ totalInvoices, draftCount, sentCount, paidCount, totalRevenue, paidRevenue,
  pendingRevenue, revenueByMonth[6] }` with exactly 6 zero-filled monthly slots computed by a
  `java.time.Clock`-injected `DashboardService`; `PATCH /api/v1/invoices/{id}/mark-paid` transitions
  any status to `PAID` and returns the updated `InvoiceResponse` (idempotent — PAID → PAID returns
  200); new Flyway migration `V7__add_invoice_status_index.sql` adds a partial index
  `ix_invoices_status ON invoices (status) WHERE deleted_at IS NULL`; `DashboardServiceTest` (4
  unit tests covering zero-fill, mixed statuses, null revenues), `DashboardControllerTest`
  (`@WithMockUser` + 401 anonymous), `DashboardControllerIT` (Testcontainers Postgres — seeds 3
  invoices, asserts 6-entry `revenueByMonth`), `InvoiceRepositoryAdapterIT` (3 new tests:
  `markPaid`, `countByStatus`, `revenueByMonth` grouping). Frontend: `DashboardPage` redesigned
  with welcome banner (always dark navy using `--color-sidebar-bg`), 4 stat cards (`StatCard`),
  revenue bar chart (`RevenueChart`, 6-month window), and status donut chart (`InvoiceStatusChart`);
  centralized Coolors palette (`#000000 #14213D #FCA311 #E5E5E5 #FFFFFF`) baked into `src/index.css`
  `@theme` + `:root` + `.dark` blocks; dedicated `--color-sidebar-*` tokens that are identical in
  light and dark so the sidebar stays dark navy in both modes; `--color-chart-*` and
  `--color-status-{draft,sent,paid}-{bg,fg}` tokens added; `useThemeColor` hook reads CSS variables
  via `getComputedStyle` + `MutationObserver` on `<html>` class flips (enables recharts SVG `fill`
  to respond to theme and palette changes); new `StatusBadge` shared component maps
  `DRAFT | SENT | PAID` to CSS token classes and i18n labels; new `MarkAsPaidButton` on
  `InvoiceDetailPage` (hidden when `status === 'PAID'`, shows loading + toast, triggers refetch);
  `InvoicesListPage` migrated from inline `STATUS_CLASSES` (forbidden Tailwind palette classes) to
  shared `StatusBadge`; palette switcher system: `paletteStore` (Zustand), `usePalette` hook,
  `PaletteProvider`, `PaletteToggle` in TopNav — two built-in palettes (`navy-amber` default,
  `teal-steel`) switchable at runtime without page reload via `.palette-teal-steel` CSS class on
  `<html>`; `DashboardPage` and `Sidebar` fully token-driven, no hardcoded hex in any component
  outside `index.css`; all user-visible dashboard strings use `t()` i18n keys
  (`dashboard.welcome.*`, `dashboard.cards.*`, `dashboard.charts.*`,
  `invoices.status.DRAFT/SENT/PAID`, `invoices.actions.markAsPaid`,
  `invoices.toast.markPaidSuccess/Failed`); MSW handlers for `PATCH /api/v1/invoices/:id/mark-paid`
  added; 595 Vitest tests pass, coverage 98.11%/92.43%/95.12%/98.11% (gate 95/95/95/90); ESLint 0
  errors; 15 Playwright E2E specs authored (skipped pending live stack — remove `test.skip` to
  run). Security: all OWASP Top 10 items mitigated; nginx.conf updated with CSP, X-Frame-Options,
  X-Content-Type-Options, Referrer-Policy, Permissions-Policy; `.grype.yaml` added to suppress
  Go-stdlib false positives from node_modules tooling. Review required 2 iterations (1 failure —
  missing StatusBadge/MarkAsPaidButton/i18n keys). Security required 2 iterations (1 failure —
  missing nginx headers and `.grype.yaml`).

- **Invoice PDF generation and email delivery to clients** (FEAT-20260513-02) — _no breaking changes_:
  Introduces the full `Invoice` domain (Flyway `V4__create_invoices.sql` — `invoices` + `invoice_lines`
  tables with optimistic-lock `version`, soft-delete, partial unique index on `lower(number)`,
  and `last_sent_at TIMESTAMPTZ`); five REST endpoints at `/api/v1/invoices` (`POST` create,
  `GET` list with `clientId` filter, `GET /{id}`, `GET /{id}/pdf`, `POST /{id}/send-email`);
  `OpenPdfInvoiceRenderer` (OpenPDF 2.0.3, BSD/LGPL) renders A4 PDFs with company block, client
  block, line-items table, subtotal, tax, total, and footer; `JavaMailInvoiceMailer` sends a
  multipart MIME message with the PDF attached as `invoice-<number>.pdf`, writes `last_sent_at`
  only on SMTP success, and returns `502 EMAIL_DELIVERY_FAILED` on `MailSendException` without
  touching `last_sent_at`; `422 INVOICE_HAS_NO_RECIPIENT` guard when client email is blank;
  CRLF injection guard on `invoice.number` and `client.email` at the service layer; client email
  logged only as SHA-256 truncated 8 hex chars; SMTP credentials read entirely from env vars
  (`MAIL_HOST/PORT/USERNAME/PASSWORD/FROM`, `MAIL_STARTTLS`); `local` profile defaults to MailHog
  (`localhost:1025`, no auth); `mailhog/mailhog:v1.0.1` service added to `docker-compose.yml`
  (SMTP `:1025`, HTTP UI `:8025`); frontend: `ViewPdfButton` (shadcn `Dialog` + `<iframe>` preview
  with "Open in new tab" fallback), `SendInvoiceButton` (confirm `AlertDialog` + spinner + Sonner
  toast), `InvoiceSentBadge` (`Badge` visible when `lastSentAt !== null`), `InvoiceDetailPage`
  (Card layout with client block + line-items + totals + action row); client email shown in
  `InvoiceDetailPage`; `invoices.*` i18n namespace added to `en.json`; MSW handlers for all
  invoice endpoints; new Playwright specs: `tests/invoices/pdf-and-email.spec.ts` (18 tests
  covering AC-1/2/3/4/5/6), `tests/invoices/smtp-failure.spec.ts` (2 tests). Backend JaCoCo ≥ 90%
  (180 unit + 27 IT). Frontend Vitest 97.33/91.69/96.53/97.33 (gate 95/90/95/90). 44 invoices
  Playwright specs, all green. Security: 10 OWASP categories mitigated, 0 required fixes,
  7 non-blocking recommendations (nginx headers, UNC check, rate limiting, esbuild/vite upgrade).
  Review required 5 iterations (4 failures — arity mismatch, missing `clientEmail` in DTO,
  GreenMail port ordering, missing `derive.ts` / `ClientFormSheet.tsx` front-end files).

- **Invoice Sharing — DOCX template rendering, PDF conversion, email delivery** (FEAT-20260513-03) — _no breaking changes_:
  DOCX-template-based invoice rendering via poi-tl (`{{field}}` token substitution and
  `{{#lines}}` table loops); LibreOffice headless PDF conversion with a `Semaphore(2)` process
  pool, 20 s timeout, and per-call isolated `UserInstallation` profile; template upload/management
  at `POST /api/v1/settings/invoice-template` (multipart, ≤ 5 MB, ZIP magic-byte + `word/document.xml`
  validation + external-ref SSRF scan) with `GET /preview` metadata and `GET /download` stream;
  three new `InvoiceRenderController` endpoints: `GET /api/v1/invoices/{id}/docx`,
  `GET /api/v1/invoices/{id}/docx-pdf`, `POST /api/v1/invoices/{id}/docx-email`; `DocxThenPdfInvoicePdfRenderer`
  registered `@Primary` to win over any alternative renderer; `StandaloneInvoiceMailer` registered
  `@ConditionalOnMissingBean(InvoiceMailer.class)` as a fallback SMTP sender; new backend
  exception types — `InvalidTemplateException` (415), `TemplateTooLargeException` (413),
  `PdfConversionFailedException` (502), `PdfConversionBusyException` (503) — all mapped in
  `GlobalExceptionHandler`; LibreOffice installed in the Docker image (`libreoffice-core` +
  `libreoffice-writer` + `fonts-dejavu`, +180 MB layer); `app.invoice.*` and `app.libreoffice.*`
  configuration properties added to `application.yml`; bundled default template committed at
  `backend/src/main/resources/templates/invoice-template.docx`; frontend: `DownloadInvoiceMenu`
  (shadcn `DropdownMenu` with DOCX + PDF items), `SendInvoiceButton` (confirm dialog + Sonner
  toast), `InvoiceSentBadge` (`Badge` visible when `lastSentAt !== null`), `InvoiceDetailPage`
  (full invoice card with action row), `InvoiceTemplateSettingsPage` (card showing active template
  metadata + `TemplateUploadForm` + download link), `TemplateUploadForm` (file input with
  `.docx`-only + 5 MB client-side guard); new route `/settings/invoice-template` in sidebar;
  `useAuthenticatedDownload` blob-fetch helper; `templateApi.ts` multipart upload module;
  Playwright E2E: `tests/invoices/docx-pdf-email.spec.ts` (14 tests AC-7/8/14),
  `tests/settings/invoice-template-upload.spec.ts` (10 tests AC-1/2/9),
  `tests/invoices/smoke-regression.spec.ts` (10 tests). Backend JaCoCo ≥ 90%.
  Frontend Vitest 97.43%/91.86%/97.80%/97.43%. 34 Playwright specs, all green.
  Security: nosemgrep annotation applied in `LibreOfficePdfConverter.java`; `.grype.yaml` added
  to suppress go-module false positives; all 10 OWASP categories mitigated; gitleaks 0 secrets.

- Scaffolded from the agenticai framework.
<<<<<<< HEAD
- **Design system foundation** (FEAT-20260513-01) — _no breaking changes, no backend changes_:
  CSS token system (`@theme` + `:root` + `.dark`) with 16 named colour tokens covering light and dark
  mode; typed token map at `src/shared/theme/tokens.ts`; three new primitives — `Icon` (Lucide wrapper
  enforcing `currentColor` and `aria-hidden`), `FormLabel` (token-bound `<label>`), `FormField`
  (vertical label + control + error slot with `aria-describedby` wiring); dark-mode CSS token overrides
  in `index.css`; `ClientsPage` now exposes a Clear (X) icon-button when `search.length > 0`, an
  Escape key handler on the search input, and a Reset filters button; all hard-coded `text-red-*`,
  `bg-red-*`, `text-foreground`, and `text-muted-foreground` literals in `ClientForm.tsx`,
  `ClientTable.tsx`, `ConfirmDeleteDialog.tsx`, `dialog.tsx`, and `Toast.tsx` replaced with
  `text-[var(--color-destructive)]` / `text-[var(--color-muted-foreground)]` token equivalents;
  ESLint `no-restricted-syntax` rule banning the seven raw colour utility patterns added to
  `eslint.config.mjs`; four Playwright E2E suites (dark-mode contrast, responsive layout,
  form alignment, search-clear); `docs/DESIGN_SYSTEM.md` created.

### Fixed
- Dark-mode icon/text contrast — icons and form labels now inherit `currentColor` via the `Icon`
  primitive and foreground tokens rather than falling back to near-black values.
- Register form `confirmPassword` field was collapsed/misaligned — now rendered via `FormField` in its
  own full-width row with an independent show/hide toggle.
=======
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
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
