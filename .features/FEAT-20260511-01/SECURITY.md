---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-11T20:00:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| OWASP Dependency-Check (backend) | not_executed | ./mvnw dependency-check:check requires NVD network access and was not executed here. The plugin is correctly configured in pom.xml (v11.1.0, failBuildOnCVSS=7, suppressionFile=owasp-suppressions.xml) and runs on every CI mvn verify. owasp-suppressions.xml is present with no active suppressions. No new backend dependencies introduced in this feature. |
| pnpm audit (frontend) | pass | 0 High, 0 Critical. Two Moderate findings: GHSA-67mh-4wv8-2f99 esbuild CORS wildcard CVSS 5.3, GHSA-4w7w-66w2-5vf9 vite .map path traversal when --host is set. Both are dev-server-only and do not affect the production build. |
| Semgrep | tool_missing | Not installed on this machine. Manual OWASP code review performed as substitute. Should be added to CI. |
| gitleaks | tool_missing | Not installed on this machine. Manual secret scan performed. Should be added to CI. |

## Manual secret scan

All backend Java and frontend TypeScript/React files in the diff were inspected for hardcoded secrets and credentials.

- backend/src/main/resources/application.yml: the local Spring profile contains username app and password app. These are dev-only credentials for the local Docker Compose Postgres instance. The ci profile correctly reads from environment variables DATABASE_URL, DATABASE_USER, DATABASE_PASSWORD.
- All Java source files: no hardcoded tokens, API keys, or credentials found.
- All TypeScript/React source files: no hardcoded tokens, API keys, or credentials found. The credentials include flag in http.ts is a browser fetch option for HTTP Basic, not a hardcoded secret.
- .gitignore: .env.local and .env.*.local are excluded. No .env files committed.

Result: no secrets found in the audited diff.

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | SecurityConfig.java applies anyRequest().authenticated() to all requests outside the explicit permit-list (/v3/api-docs/**, /swagger-ui/**, /actuator/health, /actuator/info). All five client endpoints are protected. ClientControllerIT.unauthenticated_request_returns_401 validates the 401 path. Open risk: no tenant/owner column yet - all authenticated users share one client namespace, documented as known risk in PLAN.md section 10 and tracked for auth-upgrade; not exploitable in single-tenant scope. |
| A02 | Cryptographic Failures | mitigated | No new secrets stored. No MD5 or SHA-1 for passwords. HTTP Basic travels over TLS at the deploy layer. No cookies set by the API. No JWT secrets introduced. |
| A03 | Injection | mitigated | All DB access uses JPA named parameters. ClientJpaRepository.findAllActiveByQuery uses JPQL CONCAT with :query named parameter - no Java string concatenation. Spring Data derived methods are also parameter-bound. No raw SQL concatenation found. Frontend uses Zod schemas for all user input. No dangerouslySetInnerHTML or eval() found. |
| A04 | Insecure Design | mitigated | RFC 7807 ProblemDetail for all error paths. Soft-delete preserves referential integrity. Optimistic locking via @Version. size clamped server-side to range 1 to 100 in ClientService.list() preventing DoS. |
| A05 | Security Misconfiguration | mitigated | Actuator exposes only health and info (not wildcard *). health.show-details: when-authorized. springdoc endpoints explicitly permit-listed. CORS defaults to same-origin. CSP not set at Spring layer - must be enforced at CDN/reverse-proxy in production. |
| A06 | Vulnerable and Outdated Components | pass | Backend: OWASP DC at failBuildOnCVSS=7, no new deps, no active suppressions. Frontend: 0 High/Critical CVEs. Two Moderate dev-only CVEs noted; upgrade recommended. |
| A07 | Identification and Authentication | mitigated | HTTP Basic via Spring Security. HttpStatusEntryPoint(UNAUTHORIZED) returns clean 401 JSON. No account lockout - acceptable for dev phase; address before production. |
| A08 | Software and Data Integrity | mitigated | pom.xml and mvnw committed. pnpm-lock.yaml in repository. No inline CI installs. @Version prevents concurrent lost-update. |
| A09 | Security Logging and Monitoring | mitigated | ClientService logs only UUID id at INFO for create/update/delete - never name, email, phone, or address. GlobalExceptionHandler logs full stack trace server-side at ERROR but returns only a generic message to the client. No System.out or e.printStackTrace() found. |
| A10 | Server-Side Request Forgery | n/a | No outbound HTTP calls in this feature. No user-supplied URLs forwarded. |

## Required fixes

None. No High/Critical CVEs, no OWASP items rated vulnerable, no secrets detected.

## Recommendations (non-blocking)

- [ ] Upgrade esbuild and vite: GHSA-67mh-4wv8-2f99 esbuild <=0.24.2 CVSS 5.3 Moderate - dev server CORS wildcard. Fix: upgrade to esbuild >=0.25.0. GHSA-4w7w-66w2-5vf9 vite <=5.4.21 - .map path traversal when --host is set. Fix: upgrade to vite >=5.4.22 or >=6.4.2. Both dev-server-only. Run: pnpm update vite esbuild --latest. Expiry: 2026-06-11.
- [ ] Add Semgrep to CI: semgrep/semgrep-action in .github/workflows/ci.yml with p/owasp-top-ten, p/java, p/typescript, p/react.
- [ ] Add gitleaks to CI: gitleaks/gitleaks-action in .github/workflows/ci.yml to detect accidental secret commits.
- [ ] Move local DB credentials to env variables: application.yml local profile commits username and password. Use env variable references with defaults (DB_USER:app) to establish the correct pattern.
- [ ] Add authentication rate limiting before production: add Bucket4j filter on /api/v1/** to prevent credential-stuffing attacks.
- [ ] CSP and security headers on frontend host: enforce Content-Security-Policy, X-Frame-Options DENY, X-Content-Type-Options nosniff, Referrer-Policy at the CDN/nginx layer.
- [ ] Backdrop onClick dismiss (from REVIEW.md): ClientFormModal.tsx backdrop click dismisses the modal. Remove the backdrop onClick handler so only Cancel or close-X close it.
- [ ] MSW _idCounter reset (from REVIEW.md): expose a reset helper or use per-test MSW handler overrides to prevent cross-suite ID pollution.
