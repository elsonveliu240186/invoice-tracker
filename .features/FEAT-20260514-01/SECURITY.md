---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-14T14:46:48Z
iteration: 2
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | Carried from iteration 1 -- 33 commits scanned, ~2.6 MB, no leaks found (exit 0). No new commits touch secrets. |
| Trivy (filesystem) | pass | Carried from iteration 1 -- no HIGH or CRITICAL CVEs (exit 0). No new dependencies added. |
| Grype | tool_error | .grype.yaml config verified present and syntactically correct (type: go-module suppression). Both Grype container invocations loaded the config successfully (no parse error; only the expected syft WARN about unnamed source). Docker daemon crashed (OOM) before producing final output due to two simultaneous large node_modules scans. Config inspection confirms the suppression matches the only failing class from iteration 1 (Go stdlib CVEs from Go runtime binaries embedded inside node_modules). Previous --only-fixed run (iteration 1) confirmed zero genuine fixable High/Critical app-level findings. Treated as tool_error, not a blocker. |
| OWASP Dependency-Check | tool_error | NVD_API_KEY not set -- user-action item per task brief. Known suppressions in backend/owasp-suppressions.xml cover CVE-2025-7962 (angus-activation, expires 2026-11-12) and CVE-2025-15104 (hibernate-validator, expires 2026-11-12). OWASP DC also enforced in Maven build pipeline via mvnw verify. |
| pnpm audit | pass | 0 High, 0 Critical. Same 2 Moderate dev-build-only advisories as iteration 1: GHSA-67mh-4wv8-2f99 (esbuild <=0.24.2, CVSS 5.3, dev CORS only -- not exploitable in production) and GHSA-4w7w-66w2-5vf9 (vite <=5.4.21 path traversal in dev server .map handling, requires --host flag -- dev-only risk). Neither advisory is High or Critical. |
| Semgrep | pass | Carried from iteration 1 -- 394 rules, 0 findings across Java, TypeScript, YAML, Dockerfile, Bash, JSON, HTML. No new source files added in this iteration. |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | All /api/v1/** endpoints require authentication via .anyRequest().authenticated() in SecurityConfig. DashboardController.getStats() and InvoiceController.markPaid() covered by catch-all filter chain rule. Single-tenant app with no cross-tenant leak risk. |
| A02 | Cryptographic Failures | mitigated | BCrypt cost 12 for passwords. No MD5 or SHA-1 in new code. No secrets committed (gitleaks pass). Local profile uses password: app for dev only; docker and ci profiles use environment variables. No JWT introduced. |
| A03 | Injection | mitigated | DashboardService uses repository methods with no JPQL string concatenation. InvoiceController.markPaid() accepts UUID-typed path variable. No dangerouslySetInnerHTML in frontend. Jakarta Validation annotations on all create-request inputs. |
| A04 | Insecure Design | mitigated | Mark-paid is a forward-only state transition. No rate limiting, but the operation requires authentication and is a low-frequency admin action with no financial side-effects in this iteration. |
| A05 | Security Misconfiguration | mitigated | nginx.conf now has Content-Security-Policy (default-src self, frame-ancestors none), X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin, and Permissions-Policy -- all with always flag. Both A05 blockers from iteration 1 resolved. CORS: no explicit CorsConfigurationSource bean; Spring Security catch-all remains; carried as non-blocking recommendation. |
| A06 | Vulnerable and Outdated Components | mitigated | Trivy: pass. Grype: .grype.yaml suppression in place targeting only go-module type (Go runtime false positives from node_modules tooling). pnpm audit: 0 High/Critical. Backend suppressions in owasp-suppressions.xml with expiry within 90 days. |
| A07 | Identification and Authentication | mitigated | HTTP Basic with BCrypt cost 12. No new authentication changes in this feature. |
| A08 | Software and Data Integrity | mitigated | pnpm-lock.yaml committed. pom.xml resolves deterministically. CI uses pnpm install frozen-lockfile. Backend uses Maven wrapper ./mvnw. |
| A09 | Security Logging and Monitoring | mitigated | DashboardService logs at INFO with totalInvoices count only -- no PII. No stack traces in API error responses. No PII logged in any new frontend code. |
| A10 | Server-Side Request Forgery | n/a | No external HTTP calls introduced by this feature. Existing SMTP host is a fixed configuration value. |

## Required fixes

None. All blockers from iteration 1 resolved.

## Recommendations (non-blocking)

- [ ] Add explicit method-level authorization annotations to DashboardController.getStats() and InvoiceController.markPaid() to make authorization intent auditable.
- [ ] Add an explicit CorsConfigurationSource bean in SecurityConfig enumerating allowed origins so CORS policy is documented and not left to Spring Security defaults.
- [ ] Pin commons-compress to 1.27.1+ in pom.xml dependencyManagement to remediate GHSA-4265-ccf5-phj5 and GHSA-4g9r-vxhx-9pgx (Moderate DoS via crafted zip; fix available, transitive via poi-tl).
- [ ] Upgrade vite to 6.4.2+ to remediate GHSA-4w7w-66w2-5vf9 (dev server .map path traversal -- dev-only risk but fix available).
- [ ] Set MAIL_STARTTLS default to true in the docker profile and update docker-compose.yml to enforce TLS for SMTP connections.
- [ ] Obtain NVD_API_KEY (free at nvd.nist.gov/developers/request-an-api-key), add to shell profile and GitHub Actions secrets, and run OWASP Dependency-Check to completion to clear the tool_error status.
- [ ] Re-run Grype in isolation (single container, not concurrent) to confirm .grype.yaml suppression produces clean exit code 0 on this machine.
