# Security log

Append-only record of security-auditor findings and their resolutions.

## Open findings

_(none)_

## History

| Date | Feature | Finding | Severity | Resolution | Reference |
|------|---------|---------|----------|------------|-----------|
| 2026-05-12 | FEAT-20260512-02 Authentication modernization | Security audit skipped per user request (see SECURITY.md artefact). OWASP mapping authored by planner (PLAN.md §9). Three accepted v1 risks: R-1 localStorage Basic token XSS-readable; R-2 Google ID token not verified by backend; R-3 password-reset email not sent. See detail rows below. | Medium (R-1, tracked) | R-1: accept for v1, migrate to httpOnly cookie in follow-up. R-2: document limitation; add BE OIDC verifier in follow-up. R-3: `// TODO` marker approved by PLAN.md, tracked in FEATURES.md. Full audit required before production deployment. | [SECURITY.md](.features/FEAT-20260512-02/SECURITY.md) |
| 2026-05-12 | FEAT-20260512-01 Frontend design system | No required fixes. Two Moderate dev-only CVEs carried from FEAT-20260511-01: esbuild GHSA-67mh-4wv8-2f99 (CVSS 5.3, dev-server CORS) and vite GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 (dev-server path traversal). Semgrep 0 findings, gitleaks 0 secrets, `pnpm audit` 0 high/critical. Four non-blocking recommendations: remove residual `bg-slate-50 text-slate-900` from `index.html`; track vite `>=6.4.2` upgrade for CVE-2026-39365; add `Content-Security-Policy` meta tag in a security-hardening feature; migrate hard-coded English strings in `ClientForm.tsx` and `ConfirmDeleteDialog.tsx` to `en.json`. | Low | No production risk. Upgrade `vite`/`esbuild` before production deployment. CSP and full i18n consistency tracked as future features. | [SECURITY.md](.features/FEAT-20260512-01/SECURITY.md) |
| 2026-05-11 | FEAT-20260511-01 Client management | No required fixes. Two Moderate dev-only CVEs (esbuild GHSA-67mh-4wv8-2f99, vite GHSA-4w7w-66w2-5vf9) — dev server only, do not affect production build. | Low | Upgrade recommended before production (`pnpm update vite esbuild --latest`). Six non-blocking hardening recommendations logged (Semgrep/gitleaks in CI, env-var DB creds, auth rate limiting, CSP headers, backdrop-dismiss fix, MSW _idCounter reset). | [SECURITY.md](.features/FEAT-20260511-01/SECURITY.md) |

## FEAT-20260512-02 — Auth risk register

| ID | OWASP | Description | Current status | Follow-up |
|----|-------|-------------|----------------|-----------|
| R-1 | A02 Cryptographic Failures | `localStorage` stores the base64 Basic token (`email:password`). Any XSS on the origin can read it. | Accepted for v1. React JSX escaping and absence of `dangerouslySetInnerHTML` in auth components reduce surface. | Migrate to httpOnly session cookie (`FEAT-auth-cookies`). Add CSP header (`FEAT-security-hardening`). |
| R-2 | A07 Identification & Auth Failures | Firebase Google ID token is stored client-side but is **never sent to or verified by the backend**. Google-only users receive `401` on any backend call. | Documented limitation in FEATURES.md and ARCHITECTURE.md ADR-010. | Add Spring Security `JwtDecoder` pointing at Firebase JWKS endpoint. |
| R-3 | A04 Insecure Design | `POST /api/v1/auth/forgot-password` always returns `204` but never sends a reset email (SMTP not wired). The endpoint is anti-enumeration-safe but functionally a stub. | `// TODO: enqueue reset email` in `AuthService.requestPasswordReset`. Approved by PLAN.md R-3. | Wire transactional email (SendGrid / SES / SMTP) in follow-up feature. |
| — | A01 Broken Access Control | `ProtectedRoute` client-side guard only — cannot be relied upon alone. | Backend Spring Security still requires HTTP Basic on all `/api/v1/clients/**` paths regardless of FE state. `SecurityConfigTest` verifies. | Maintain backend auth on all protected routes. |
| — | A03 Injection | Form fields are JPA-bound with parameterised queries; zod + bean validation on every request body. | No raw SQL. | No action needed. |

## OWASP Top 10 posture

The current implementation has been audited against OWASP Top 10 by the **security-auditor** agent on every feature. See `workflows/SECURITY_CHECKLIST.md` for the categories.
