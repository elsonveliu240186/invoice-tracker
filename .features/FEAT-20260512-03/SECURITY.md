---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-13T13:00:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | tool_missing | docker_not_running. Manual review substituted: no hardcoded secrets found in any source file. `.env` and `frontend/.env.local` are listed in `.gitignore` and confirmed untracked by git. |
| Trivy (filesystem) | tool_missing | docker_not_running. Manual dependency review and pnpm audit performed as substitute. |
| Grype | tool_missing | docker_not_running. Manual dependency review performed as substitute. |
| OWASP Dependency-Check | tool_missing | docker_not_running. UI-only feature with no new Java dependencies; `backend/pom.xml` unchanged. |
| pnpm audit | pass | 0 High, 0 Critical. 2 Moderate pre-existing findings carried from FEAT-20260512-01: esbuild GHSA-67mh-4wv8-2f99 (CVSS 5.3, dev-server CORS only) and vite GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 (dev-server path traversal when --host used). Neither affects production builds. |
| Semgrep | tool_missing | docker_not_running. Manual SAST review of all new and modified files performed. No `dangerouslySetInnerHTML`, `eval`, `innerHTML =`, raw SQL, or `document.write` found in any file. |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | All dashboard and client routes are nested inside `ProtectedRoute` in `App.tsx`, which redirects unauthenticated users to `/login`. No new API endpoints added. Client IDs are UUIDs passed to existing authenticated backend endpoints; no IDOR surface added by this feature. |
| A02 | Cryptographic Failures | mitigated | No new secrets or credentials introduced. The pre-existing `basicAuthToken` in `localStorage` (risk R-1, accepted for v1 in `docs/SECURITY.md`) is unchanged and scoped to `FEAT-auth-cookies` follow-up. Firebase config consumed via `import.meta.env` build-time injection; `.env.local` is gitignored and untracked. |
| A03 | Injection | mitigated | All form input flows through zod `createClientSchema` before API submission (name max 120, email RFC-validated, phone regex `/^[+\-() 0-9]+$/`, address max 500). React renders all client-supplied data as JSX text nodes (auto-escaped). Search query set via `URLSearchParams.set()` (auto-encoded). No `dangerouslySetInnerHTML` anywhere in the codebase. |
| A04 | Insecure Design | n/a | No rate-limited, payment-adjacent, or OTP flows involved. Dashboard uses `size=1` query minimising data exposure. Status filter is client-side only and makes no server-side trust decisions. |
| A05 | Security Misconfiguration | mitigated | `application.yml` restricts actuator to `health` and `info` only. Spring Security does not add permissive CORS headers by default. `nginx.conf` lacks `X-Frame-Options`, `Content-Security-Policy`, and `X-Content-Type-Options` headers — pre-existing gap from FEAT-20260512-01, not introduced by this feature, tracked as `FEAT-security-hardening`. |
| A06 | Vulnerable & Outdated Components | mitigated | `pnpm audit`: 0 High, 0 Critical. New deps (`framer-motion`, `lucide-react`, `react-i18next`, `i18next`, `react-hook-form`, `@hookform/resolvers`) — all maintained packages, no known High/Critical CVEs. `pnpm-lock.yaml` committed. No new backend deps. |
| A07 | Identification & Authentication | mitigated | `TopNav` UserMenu logout calls `useAuthStore.logout()` which clears Zustand session and `localStorage` entry then navigates to `/login`. No custom token handling introduced. Client-side `ProtectedRoute` is backed by Spring Security HTTP Basic auth enforced on every backend call. |
| A08 | Software & Data Integrity | mitigated | `pnpm-lock.yaml` committed with full dependency tree pinned. New deps use caret-major ranges consistent with project convention. CI uses `--frozen-lockfile`. |
| A09 | Security Logging & Monitoring | mitigated | No new server-side logging. `ErrorBoundary.tsx` logs via `console.error` (stack trace only, no PII). No user email, password, token, or other sensitive data logged in any new or modified file. |
| A10 | Server-Side Request Forgery | n/a | Pure frontend feature. All browser fetch calls target same-origin `/api/v1/` through Vite proxy (dev) or nginx proxy (prod). No user-supplied URLs forwarded. |

## Required fixes

None.

## Recommendations (non-blocking)

- [ ] **nginx.conf security headers**: Add `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, and a `Content-Security-Policy` header to `frontend/nginx.conf`. Pre-existing gap noted since FEAT-20260512-01; resolve in `FEAT-security-hardening` before production deployment.
- [ ] **Upgrade vite / esbuild**: Upgrade `vite` to `>=6.4.2` (CVE-2026-39365 / GHSA-4w7w-66w2-5vf9) and `esbuild` to `>=0.25.0` (GHSA-67mh-4wv8-2f99). Both are dev-server-only vulnerabilities and do not affect production builds, but should be resolved before go-live.
- [ ] **localStorage basicAuthToken (R-1, carried from FEAT-20260512-02)**: Plan migration to `httpOnly` session cookie in `FEAT-auth-cookies`. React JSX auto-escaping reduces but does not eliminate XSS credential-exposure risk.
- [ ] **Explicit CORS allow-list**: Add a `CorsConfigurationSource` bean to `SecurityConfig.java` enumerating allowed origins as a defence-in-depth measure. Currently safe by Spring Security defaults.
- [ ] **ClientStatusBadge i18n**: Hard-coded English strings "Active" / "Inactive" in `frontend/src/features/clients/ui/ClientStatusBadge.tsx` should use `t('clients.status.active')` / `t('clients.status.inactive')`. Not a security issue; carried from reviewer non-blocking findings.
