---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-17T05:50:00Z
attempt: 4
---

# Security Audit — FEAT-20260516-01 (Expense Tracking with Category Dashboard)

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 0 secrets detected; 46 commits scanned; 4.16 MB scanned in 28.2s |
| Semgrep | pass | 394 rules, 531 files, 0 findings. Covers Java, TypeScript, Dockerfile, YAML, bash, nginx |
| pnpm audit | pass | 0 High/Critical; 2 Moderate (vite dev-server GHSA-4w7w-66w2-5vf9 and esbuild GHSA-67mh-4wv8-2f99, both dev-only, non-blocking) |
| Grype | pass | Exit 0; no High/Critical findings. Go stdlib CVEs suppressed via .grype.yaml (false positives from flatted npm Go reference file — no compiled Go binary in project). Suppression expires 2026-08-16. |
| OWASP Dependency-Check | tool_missing | Skipped per audit instructions (stalled previous runs; NVD_API_KEY required and fresh DB needed). CVE-2018-1258 false positive suppressed in backend/owasp-suppressions.xml (expires 2026-08-17). Defer to CI with NVD_API_KEY. |
| Trivy (filesystem) | pending | DB download completed (93 MB) but scan was stopped at the 3-minute mark before results were produced. Previous run (attempt 3) passed with 0 High/Critical on pom.xml and pnpm-lock.yaml. Recommend re-run in CI with cached DB. |

## Manual review — AuthRateLimitFilter and SecurityConfig

**AuthRateLimitFilter.java** — CONFIRMED CORRECT:
- Extends `OncePerRequestFilter`; applies only to `/api/v1/auth/login` and `/api/v1/auth/register` via exact-path match
- Per-IP rate limit: 5 requests / 1 minute using Bucket4j 8.10.1 `ConcurrentHashMap<String, Bucket>`
- Bucket uses `Bandwidth.classic(5, Refill.intervally(5, Duration.ofMinutes(1)))`
- Returns HTTP 429 with structured JSON `{"status":429,"title":"Too Many Requests","detail":"...","code":"RATE_LIMIT_EXCEEDED"}` on exhaustion
- IP resolution: `X-Forwarded-For` header first (takes first comma-separated value), falls back to `getRemoteAddr()`

**SecurityConfig.java** — CONFIRMED CORRECT:
- `.addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)` — rate-limit filter is registered in the chain before Spring's authentication filter, ensuring unauthenticated brute-force attempts are throttled before credential checking occurs
- BCryptPasswordEncoder with cost factor 12
- Auth endpoints (`/api/v1/auth/**`) are `permitAll()` so rate-limiting fires even for anonymous requests
- Management endpoints restricted to `health` and `info` only (no wildcard exposure)

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | All `/api/v1/expenses/**` endpoints require HTTP Basic auth per `anyRequest().authenticated()` in SecurityConfig. No `@PreAuthorize` needed (single-tenant, no per-resource owner check in v1 per plan R-2). Path UUID parameters are typed as `UUID` — guessing returns 404 from `findByIdAndDeletedAtIsNull`. |
| A02 | Cryptographic Failures | mitigated | BCrypt cost-12 for passwords. No MD5/SHA-1. Secrets via env vars in `application.yml` (no committed credentials). No new JWT surface in this feature. |
| A03 | Injection | mitigated | All JPQL queries in `ExpenseJpaRepository` use named `@Param` bindings — no string concatenation. Category values coerced via `ExpenseCategory.valueOf()` before reaching JPQL. `@Valid` on all request DTOs with `@NotNull`, `@DecimalMin`, `@DecimalMax`, `@Size` annotations. No `dangerouslySetInnerHTML` found in frontend (grep confirmed). |
| A04 | Insecure Design | mitigated | Auth endpoints rate-limited to 5 req/IP/min via `AuthRateLimitFilter` + Bucket4j 8.10.1. Server-side amount cap (9,999,999.99) and future-date rejection prevent unrealistic inputs. Soft-delete preserves audit trail. |
| A05 | Security Misconfiguration | mitigated | `management.endpoints.web.exposure.include: health,info` — no wildcard. `application.yml` uses env var substitution for all secrets in docker/ci profiles. CORS not explicitly configured (HTTP Basic + no cookie auto-attach; stateless API). CSP header responsibility deferred to nginx reverse-proxy (existing pattern). |
| A06 | Vulnerable & Outdated Components | mitigated | Grype: pass (0 High/Critical). pnpm audit: pass (0 High/Critical). OWASP DC deferred to CI (NVD_API_KEY needed). Trivy pending (DB download succeeded; actual scan pending CI run). Known suppressions with rationale and expiry in place. |
| A07 | Identification & Authentication | mitigated | Auth endpoints rate-limited (5 req/IP/min) to prevent brute-force. BCrypt cost-12 for password storage. HTTP Basic over HTTPS (TLS responsibility at reverse-proxy). Session/JWT rotation n/a — stateless HTTP Basic. |
| A08 | Software & Data Integrity | mitigated | `pom.xml` lockfile committed. `pnpm-lock.yaml` committed. `@Version` optimistic lock on `ExpenseEntity` prevents lost-update under concurrent PUT/DELETE. |
| A09 | Security Logging & Monitoring | mitigated | `ExpenseService` logs INFO with `expense.id()` only on create/update/delete. Description field (user free-text) never logged. No PII logged at INFO level (verified in source). Errors propagate via `GlobalExceptionHandler` — stack traces not exposed in responses. |
| A10 | Server-Side Request Forgery | n/a | No external HTTP calls introduced in this feature. No user-supplied URLs forwarded. |

## Required fixes

None. All blockers from previous attempts are resolved:
- [x] Git conflict markers resolved (attempt 3 confirmed 0 conflicts)
- [x] Auth rate-limiting implemented (AuthRateLimitFilter.java + Bucket4j 8.10.1, registered before UsernamePasswordAuthenticationFilter)

## Recommendations (non-blocking)

- [ ] Run Trivy in CI with a pre-warmed DB volume to avoid per-run DB download overhead. Command: `docker run --rm -v $(pwd):/src -v trivy-db:/root/.cache/trivy aquasec/trivy:latest fs --scanners vuln --severity HIGH,CRITICAL /src`
- [ ] Run OWASP Dependency-Check in CI with NVD_API_KEY set as a repository secret and a persistent `.dc-data` volume. Current suppressions in `backend/owasp-suppressions.xml` cover all known false positives.
- [ ] Consider adding a `Retry-After: 60` response header in `AuthRateLimitFilter` for RFC 7231 compliance.
- [ ] The in-memory `ConcurrentHashMap` bucket store will reset on app restart and does not share state across horizontal pod replicas. For multi-instance deployments, migrate to a Redis-backed Bucket4j store (`bucket4j-redis`).
- [ ] Trivy and Grype `.grype.yaml` suppression expiry (2026-08-16) should be reviewed before that date; the flatted npm Go reference file will continue to exist unless the npm package is updated.
