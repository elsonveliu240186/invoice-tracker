---
feature_id: FEAT-20260512-02
title: Authentication modernization
documented_at: 2026-05-12T22:00:00Z
documented_by: claude-sonnet-4-6
---

# Documentation update summary — FEAT-20260512-02

## Files changed

### docs/openapi.json
Added three new paths under the new `Auth` tag:
- `POST /api/v1/auth/login` (public, no security requirement)
- `POST /api/v1/auth/register` (public)
- `POST /api/v1/auth/forgot-password` (public)

Added four new component schemas: `LoginRequest`, `RegisterRequest`, `ForgotPasswordRequest`, `AuthResponse`.
Added `UserEmailTaken` reusable response.
Extended `ProblemDetail.code` enum to include `USER_EMAIL_TAKEN`.
Added `Auth` tag to the tags list.

### docs/API.md
Updated authentication preamble to note that `/api/v1/auth/**` endpoints are public.
Added `Auth` group to the endpoint table.
Added three new endpoint sections with full request/response schema tables and error code tables.
Added `USER_EMAIL_TAKEN` to the error codes reference table.

### docs/CHANGELOG.md
Prepended an entry for FEAT-20260512-02 under `[Unreleased]` covering all backend and frontend
deliverables, coverage figures, and the three tracked v1 limitations (R-1, R-2, R-3).

### docs/FEATURES.md
Added FEAT-20260512-02 row at the top of the features table (state: Shipping).
Added a new `## FEAT-20260512-02 — Authentication modernization` section describing:
- All three backend endpoints and data model changes.
- Frontend pages, auth store, route guards, Firebase integration, Zod schemas.
- Known v1 limitation risk register (R-1 through R-3) with planned follow-up actions.

### docs/ARCHITECTURE.md
Updated `## Components — Backend` flowchart to show `AuthController`, `AuthService`, `AppUser`
domain entity, `AppUserRepositoryAdapter`, and `SecurityConfig` with the permit relationship.

Updated `## Components — Frontend` flowchart to show the auth feature slice (`LoginPage`,
`RegisterPage`, `ForgotPasswordPage`, `ProtectedRoute`, `PublicOnlyRoute`, `useAuthStore`,
Firebase Auth, `authApi`, forms, layout, Zod schemas) and the hydration call from `main.tsx`.

Added three ADR entries:
- ADR-009: localStorage Basic token accepted for v1 (XSS trade-off, follow-up planned).
- ADR-010: Google OAuth is client-side only in v1 (no BE OIDC verifier, follow-up planned).
- ADR-011: Anti-enumeration design on `/forgot-password` and `/login`.

### docs/SEQUENCE_DIAGRAMS.md
Appended `### FEAT-20260512-02 — Authentication modernization` section with two diagrams copied
verbatim from PLAN.md:
- 4a: Email/password login happy path (User → LoginPage → useAuthStore → AuthController → DB).
- 4b: Google OAuth edge case — popup blocked (User → LoginPage → Firebase → Google → error toast).

### docs/SECURITY.md
Added FEAT-20260512-02 row to the history table noting the skipped audit and the three accepted
v1 risks.
Added `## FEAT-20260512-02 — Auth risk register` section with a detailed five-row table covering
R-1 (localStorage token), R-2 (Google token not verified by BE), R-3 (password-reset stub),
access-control defence-in-depth, and injection mitigations.

### postman/collection.json
Added new `Auth` folder as the first item group, containing three requests:
- `POST Login` — sets `authToken` environment variable on success via `pm.environment.set`.
- `POST Register` — verifies 201 + body shape.
- `POST Forgot Password` — verifies 204 + empty body.
All three requests use `auth: { type: "noauth" }` (no Basic credentials needed).

### postman/local-dev.environment.json
No changes required. All necessary variables (`baseUrl`, `apiVersion`, `username`, `password`,
`authToken`, `clientId`) were already present.

## No files deleted

All updates are additive. No existing content was removed from any document.
