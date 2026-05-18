---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-17T16:00:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 59 commits scanned (~5 MB); no leaks found |
| Trivy (filesystem) | skipped | Per project policy: run only on explicit request; CI handles image scanning |
| Grype | skipped | Per project policy: run only on explicit request |
| OWASP Dependency-Check | skipped | Per memory policy (feedback_owasp_dc.md): separate CI job. Existing suppressions in `backend/owasp-suppressions.xml` cover all Tomcat 11.0.21 CVEs (expiry 2026-08-17) and false-positive CVE-2018-1258 on spring-security-core |
| pnpm audit | pass | 0 High, 0 Critical. 2 moderate: GHSA-67mh-4wv8-2f99 (esbuild 0.21.5 dev-server CORS, CVSS 5.3) and GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 (vite 5.4.21 `.map` path traversal) — both dev-toolchain only, not present in production bundle |
| Semgrep | pass | 394 rules; 550 files (Java, TypeScript, YAML, Dockerfile, bash, JSON); 0 findings |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | Both new endpoints inherit `anyRequest().authenticated()` from `SecurityConfig`. No per-endpoint overrides. 401 path explicitly tested in `DashboardControllerTest` and `DashboardControllerIT`. Endpoints return only aggregate data; no per-object IDs that can be traversed. |
| A02 | Cryptographic Failures | n/a | No new auth, cookie, or cryptographic surface. BCrypt cost-12 unchanged. No new secrets committed. |
| A03 | Injection | mitigated | All new native queries use Spring Data `@Param` binding (`:fromDate`/`:toDate`). `from`/`to` parsed by Spring as `LocalDate` at the binding layer; non-ISO-date values rejected with 400 before reaching the query. No string concatenation in JPQL or SQL. Frontend sends dates via `URLSearchParams` from `<input type="date">`; no raw user string interpolated into URL or query. No `dangerouslySetInnerHTML` in new React components. |
| A04 | Insecure Design | mitigated | `getExpenseStats` enforces `from <= to` (400) and 24-month max window (400 via `IllegalArgumentException`). `getStats` does not enforce `from <= to` (see Recommendations — non-blocking behavioural gap, not a security risk). Rate-limiting on auth endpoints unchanged. |
| A05 | Security Misconfiguration | mitigated | `management.endpoints.web.exposure.include` is `health,info` only — no wildcard. `nginx.conf` sets `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options`, `Referrer-Policy`, and `Permissions-Policy` on all HTML responses. New endpoints inherit the project-wide CSRF-disabled HTTP Basic posture appropriate for this stateless SPA. |
| A06 | Vulnerable & Outdated Components | mitigated | pnpm audit: 0 High/Critical. OWASP DC runs in CI. Pre-existing Tomcat 11.0.21 CVE suppressions valid (expiry 2026-08-17). Two moderate pnpm findings are dev-toolchain only and non-blocking. |
| A07 | Identification & Authentication | mitigated | No new auth surface. HTTP Basic filter chain unchanged. BCrypt cost-12 pre-existing. No session or token changes. |
| A08 | Software & Data Integrity | mitigated | `pnpm-lock.yaml` committed. `pom.xml` resolves deterministically via BOM. `V13__add_expense_dashboard_indexes.sql` adds only a read-optimisation partial index — no schema change. |
| A09 | Security Logging & Monitoring | mitigated | `DashboardService` logs `from`, `to`, `grandTotal` / `totalInvoices` at INFO. No PII, no expense descriptions, no per-user identifiers. `IllegalArgumentException` message not propagated to the HTTP response body (controller returns `ResponseEntity.badRequest().build()` with no body). |
| A10 | Server-Side Request Forgery | n/a | No outbound HTTP calls in new code. No user-supplied URLs. |

## Required fixes

None. All tools passed with no High/Critical findings; no OWASP item is vulnerable.

## Recommendations (non-blocking)

- [ ] **Add `from > to` validation guard to `getStats`** (`DashboardController` lines 36–43): `getExpenseStats` returns 400 when `from` is after `to`; `getStats` silently passes an inverted range to the service. The parameterised queries prevent injection and the DB returns empty results (not incorrect data), but the asymmetric behaviour is confusing and could mask client-side bugs. Add the same two-line guard used in `getExpenseStats` before delegating to the service.
- [ ] **Scope `X-Forwarded-For` trust in `AuthRateLimitFilter`** (pre-existing, not introduced by this feature): `resolveClientIp()` trusts the raw `X-Forwarded-For` header, which an attacker can spoof to exhaust other IPs' rate-limit buckets or rotate spoofed IPs to bypass their own bucket. Fix by using Spring's `ForwardedHeaderFilter` or `server.tomcat.remoteip.*` config to restrict trust to known proxy addresses. File a separate tracking issue; this is not a regression from FEAT-20260517-01.
- [ ] **Document moderate pnpm advisories** in `SECURITY_SUPPRESSIONS.md` per suppression policy (reason + 30-day expiry) to confirm they are accepted: GHSA-67mh-4wv8-2f99 (esbuild dev-server CORS) and GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 (vite `.map` path traversal) affect the dev toolchain only — neither is present in the production bundle.
- [ ] **Replace `unsafe-inline` in nginx CSP** `script-src` with a nonce- or hash-based policy in a future hardening sprint (pre-existing; out of scope for this feature).
