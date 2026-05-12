# Features

Maintained by the **documentation** subagent. One row per feature.

| ID | Title | State | Owner | Plan | Review | Security | QA | PR |
|----|-------|-------|-------|------|--------|----------|----|----|
| FEAT-20260512-02 | Authentication modernization | Shipping | elsonveliu | [PLAN.md](.features/FEAT-20260512-02/PLAN.md) | [REVIEW.md](.features/FEAT-20260512-02/REVIEW.md) | [SECURITY.md](.features/FEAT-20260512-02/SECURITY.md) | [QA.md](.features/FEAT-20260512-02/QA.md) | — |
| FEAT-20260512-01 | Frontend design system foundation | Shipping | elsonveliu | [PLAN.md](.features/FEAT-20260512-01/PLAN.md) | [REVIEW.md](.features/FEAT-20260512-01/REVIEW.md) | [SECURITY.md](.features/FEAT-20260512-01/SECURITY.md) | [QA.md](.features/FEAT-20260512-01/QA.md) | — |
| FEAT-20260511-01 | Client management (CRUD) | Done | elsonveliu | [PLAN.md](.features/FEAT-20260511-01/PLAN.md) | [REVIEW.md](.features/FEAT-20260511-01/REVIEW.md) | [SECURITY.md](.features/FEAT-20260511-01/SECURITY.md) | [QA.md](.features/FEAT-20260511-01/QA.md) | — |

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
