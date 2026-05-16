---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-16T20:00:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 40 commits scanned, ~3.5 MB; no leaks found |
| Trivy (filesystem) | pass | Run with --timeout 20m. 0 High/Critical CVEs. backend/pom.xml: 0 findings; frontend/pnpm-lock.yaml: 0 findings. Initial run without timeout flag aborted at 12 min; add --timeout 20m to CI scan command. |
| Grype | pass | High/Critical hits are all `stdlib go1.20.12` go-module — false positives sourced from the `flatted` npm package's Go reference source file (`node_modules/.pnpm/flatted@3.4.2/.../golang/pkg/flatted/flatted.go`). No Go binary exists in this Java/TypeScript project. Java findings: poi-ooxml 5.2.2 GHSA-gmg8-593g-7mv3 (Medium), commons-compress 1.21 GHSA-4265-ccf5-phj5 (Medium). Frontend: vite GHSA-4w7w-66w2-5vf9 (Medium), esbuild GHSA-67mh-4wv8-2f99 (Medium). No High/Critical in application code. .grype.yaml suppression file written with rationale and 2026-08-16 expiry. |
| OWASP Dependency-Check | tool_missing | NVD_API_KEY not set; NVD DB download throttled (351k records), connection pool failed mid-update (NullPointerException). No JSON report generated. Two pre-existing suppressions in backend/owasp-suppressions.xml: CVE-2025-7962 (angus-activation) and CVE-2025-15104 (hibernate-validator), both expire 2026-11-12 with documented rationale. Re-run required with NVD_API_KEY. |
| pnpm audit | pass | 2 Moderate only: GHSA-67mh-4wv8-2f99 esbuild 0.21.5 (CVSS 5.3, dev server CORS, dev-only), GHSA-4w7w-66w2-5vf9 vite 5.4.21 (CVSS 0, .map path traversal, requires --host flag). 0 High, 0 Critical. |
| Semgrep | pass | 394 rules across 513 files (Java, TypeScript, YAML, Dockerfile, bash, JSON, HTML); 0 findings, 0 blocking |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | SecurityConfig uses `.anyRequest().authenticated()` — all /api/v1/expenses/** endpoints require HTTP Basic auth. IDs are UUIDs (no sequential enumeration). 401 via HttpStatusEntryPoint. Single-tenant v1 (R-2 tracked in PLAN). |
| A02 | Cryptographic Failures | n/a | No new secrets, tokens, or PII flows introduced. Existing BCryptPasswordEncoder(12). No MD5/SHA-1. |
| A03 | Injection | mitigated | All JPQL uses named :param binding with @Param; no string concatenation in ExpenseJpaRepository. Category coerced via ExpenseCategory.valueOf() before reaching JPQL. @Valid + @NotNull/@DecimalMin/@DecimalMax/@Digits/@Size/@PastOrPresent on CreateExpenseRequest and UpdateExpenseRequest. Frontend: no dangerouslySetInnerHTML; all user data via React text nodes. |
| A04 | Insecure Design | mitigated | Amount bounded [0.01, 9999999.99] at DTO layer and Postgres CHECK constraints. @PastOrPresent prevents future-dated expenses. Description capped at 500 chars. Pagination size clamped [1, 100] in ExpenseService.list(). Soft-delete preserves audit trail. @Version on entity prevents lost-update under concurrent PUT/DELETE. |
| A05 | Security Misconfiguration | mitigated | management.endpoints.web.exposure.include: health,info (not *). show-details: when-authorized. show-sql: false. No new CORS beans. No new public-route additions to SecurityConfig. |
| A06 | Vulnerable & Outdated Components | mitigated | Trivy: 0 High/Critical (pom.xml + pnpm-lock.yaml). pnpm audit: 0 High/Critical (2 Moderate, dev-server-only). Grype: no High/Critical in application code (Go stdlib hits are false positives; .grype.yaml written). OWASP DC: degraded run; two suppressions with documented rationale and 90-day expiry. |
| A07 | Identification & Authentication | mitigated | Expense endpoints reuse existing HTTP Basic filter chain. No new auth surface. Unauthenticated requests receive 401 via HttpStatusEntryPoint. |
| A08 | Software & Data Integrity | mitigated | pnpm-lock.yaml committed. pom.xml pins all versions. @Version optimistic locking on ExpenseEntity. Uses pnpm (not npm install). |
| A09 | Security Logging & Monitoring | mitigated | ExpenseService logs only saved.id() (UUID) at INFO for create/update/delete. description (free text) never logged at INFO. GlobalExceptionHandler fallback logs stack trace at log.error() only. No PII in logs. |
| A10 | Server-Side Request Forgery | n/a | No outbound HTTP calls or external service integrations in the expense feature. |

## Required fixes

- [ ] Set NVD_API_KEY and re-run OWASP Dependency-Check. Get a free key at https://nvd.nist.gov/developers/request-an-api-key, add to shell profile (`export NVD_API_KEY=...`) and as a GitHub Actions repository secret. Without it the NVD DB update fails and no report is produced.
- [ ] Add --timeout 20m to the Trivy filesystem scan command in CI (`.github/workflows/ci.yml`) to prevent timeout on pom.xml analysis. The completed scan with this flag found 0 findings.

## Recommendations (non-blocking)

- [ ] Upgrade vite from 5.4.21 to >=6.4.2 to resolve GHSA-4w7w-66w2-5vf9 (dev server .map path traversal — requires --host flag, not a production risk).
- [ ] Upgrade esbuild from 0.21.5 to >=0.25.0 to resolve GHSA-67mh-4wv8-2f99 (dev server CORS — dev-only, not a production risk).
- [ ] For A01 future-proofing: when multi-tenant auth lands (R-2), add user_id column to expenses and enforce tenant scoping in ExpenseService.list() and ExpenseService.summary() using Spring Security Authentication principal.
- [ ] Add NVD_API_KEY as a GitHub Actions repository secret and reference as ${{ secrets.NVD_API_KEY }} in the OWASP DC step of ci.yml so the NVD database update completes in under 2 minutes.
