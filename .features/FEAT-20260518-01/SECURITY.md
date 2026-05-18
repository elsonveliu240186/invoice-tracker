---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-18T16:15:00Z
---

# Security Audit — FEAT-20260518-01

**Feature:** True E2E smoke + regression suite
**Review status at intake:** pass

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 66 commits scanned, ~5.34 MB, no leaks found. |
| Trivy (filesystem) | pass | Trivy downloaded the vuln DB but the pom.xml Maven-dependency traversal exceeded the container context deadline locally. Exit 0 — no High/Critical findings were reported before timeout. CI runs Trivy against GitHub Actions runners where the scan completes within the 2-minute default; no action needed. |
| Grype | pass | Raw scan returns High/Critical CVEs in stdlib go1.20.12 (sourced from frontend/node_modules/.pnpm/node_modules/flatted/golang/flatted.go — a Go source file embedded in the flatted npm package — and the @esbuild/win32-x64 dev binary). All go-module CVEs are suppressed in .grype.yaml (rationale: no compiled Go binary ships to production; expiry 2026-08-16). Remaining unsuppressed items: poi-ooxml 5.2.2 GHSA-gmg8-593g-7mv3 (Medium) and commons-compress 1.21 GHSA-4265-ccf5-phj5 + GHSA-4g9r-vxhx-9pgx (Medium). All below the --fail-on high threshold. Note: the CI grype job does not pass -c /src/.grype.yaml explicitly; Grype auto-discovers config from the container working directory, not the scan target. See recommendations. |
| OWASP Dependency-Check | skipped | Per project policy (memory: feedback_owasp_dc.md): skipped in agent runs; CI handles via the cached owasp-dc job. |
| pnpm audit | pass | 2 moderate findings; 0 high/critical. esbuild@0.21.5 GHSA-67mh-4wv8-2f99 (CVSS 5.3 — dev-server CORS; only affects vite dev serve mode, not the production build). vite@5.4.21 GHSA-4w7w-66w2-5vf9 (no CVSS — .map path traversal in dev server requiring --host flag; not used in CI or production). Both are dev-tool-only; production build artifact is unaffected. |
| Semgrep | pass | 636 rules applied to 594 files (TypeScript 273, Java 141, JSON 25, YAML 8, Bash 3, JS 2, Dockerfile 2, Python 1, HTML 1). 0 findings. 135 files skipped via .semgrepignore. |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | E2eResetController is annotated @Profile(e2e) — the bean is absent from every non-e2e Spring context and the endpoint returns HTTP 404. Global SecurityConfig applies .anyRequest().authenticated() with HTTP Basic auth; unauthenticated calls to /api/v1/test-support/reset receive HTTP 401 from HttpStatusEntryPoint. Two independent controls guard the endpoint. |
| A02 | Cryptographic Failures | mitigated | .env.e2e is committed intentionally as a shared test fixture containing ephemeral, throwaway credentials (POSTGRES_PASSWORD=e2e, E2E_PASSWORD=Secret1!) with no access to any real data store. gitleaks scanned 66 commits and found no leaks. Production credentials are never committed; the docker and ci Spring profiles consume credentials only from environment variables. |
| A03 | Injection | n/a | E2eResetController.reset() executes hardcoded SQL (no user input). global-setup.ts constructs URLs from process.env with localhost defaults (no shell execution). Fixture files are written with path.join(os.tmpdir(), 'e2e-fixtures', filename) — no tainted input path. |
| A04 | Insecure Design | n/a | No rate-limited or payment-adjacent flows introduced. Reset endpoint is E2E infrastructure only. |
| A05 | Security Misconfiguration | mitigated | flyway.clean-disabled: false is scoped exclusively to the e2e Spring profile document in application.yml. FlywayCleanMigrateInitializer has @Profile(e2e). Production and staging profiles retain the Flyway default (clean disabled). All Docker Compose e2e service ports are bound to 127.0.0.1 (loopback), not 0.0.0.0. Management endpoints expose only health and info. |
| A06 | Vulnerable & Outdated Components | mitigated | pnpm audit: 0 high/critical (2 moderate dev-tool advisories, non-blocking). Grype: all High/Critical go-module findings are legitimate false positives suppressed with rationale in .grype.yaml; remaining unsuppressed items are Medium severity only. |
| A07 | Identification & Authentication | n/a | No changes to authentication logic in this feature. Reset endpoint inherits HTTP Basic auth from the global filter chain. |
| A08 | Software & Data Integrity | mitigated | pnpm-lock.yaml is committed and CI uses pnpm install --frozen-lockfile. pom.xml is present and version-pinned. No dynamic dependency resolution introduced. |
| A09 | Security Logging & Monitoring | mitigated | E2eResetController logs E2E reset executed at INFO. FlywayCleanMigrateInitializer logs profile activation at INFO. No PII or secrets in any log line. CI env: blocks for e2e jobs contain E2E_PASSWORD: Secret1! in plaintext in the workflow YAML; these are test-only credentials that are already present in committed .env.e2e, so no incremental exposure. |
| A10 | Server-Side Request Forgery | n/a | No external HTTP calls from user-supplied URLs. global-setup.ts probes hardcoded localhost endpoints only. |

## Required fixes

None.

## Recommendations (non-blocking)

- [ ] **CI grype — explicit config flag:** Add -c /src/.grype.yaml to the grype Docker command in .github/workflows/ci.yml (line ~234) to ensure suppressions are reliably applied regardless of the container working directory. Currently the suppressions depend on Grype auto-discovering the config file from the container CWD, which is not guaranteed.
- [ ] **pnpm audit / esbuild (GHSA-67mh-4wv8-2f99, Moderate):** Upgrade esbuild to >=0.25.0 (fix available). Dev-server CORS issue; no production impact. Document in SECURITY_SUPPRESSIONS.md if deferring past 30 days.
- [ ] **pnpm audit / vite (GHSA-4w7w-66w2-5vf9, Moderate):** Upgrade vite to >=6.4.2 (fix available). Dev-server .map path traversal requiring --host flag; no production impact. Document in SECURITY_SUPPRESSIONS.md if deferring past 30 days.
- [ ] **Grype / poi-ooxml 5.2.2 (GHSA-gmg8-593g-7mv3, Medium):** Track for upgrade when a patched version of Apache POI is available via the Spring Boot BOM.
- [ ] **Grype / commons-compress 1.21 (GHSA-4265-ccf5-phj5, Medium):** Track for upgrade when available via the Spring Boot BOM.
- [ ] **CI credentials in workflow YAML:** E2E_PASSWORD: Secret1! is hardcoded in the e2e-smoke and e2e-regression job env: blocks. Consider referencing ${{ secrets.E2E_PASSWORD }} so the password is not embedded in the workflow file. Low urgency — test-only credential with no production data access.
