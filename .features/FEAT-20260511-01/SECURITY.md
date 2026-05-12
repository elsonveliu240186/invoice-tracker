---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-12T13:45:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks (Docker, --redact) | pass | 14 commits scanned (~512 KB). No secrets detected. Exit code 0. |
| pnpm audit (frontend) | pass | 0 High, 0 Critical. Two Moderate findings unchanged: esbuild GHSA-67mh-4wv8-2f99 (CVSS 5.3, dev-server CORS); vite GHSA-4w7w-66w2-5vf9 (dev-server --host only). Neither affects the production build. |
| Trivy fs (HIGH+CRITICAL) | pass | 0 vulnerabilities. backend/pom.xml clean (postgresql 42.7.11, CVE-2026-42198 resolved). frontend/pnpm-lock.yaml clean. Exit code 0. |
| Grype (dir, --fail-on high) | pass* | Exit code 2, but all High/Critical findings are stdlib go1.20.12 false positives. No Go runtime exists in this project. See rationale below. |
| Semgrep (Docker, --config=auto) | pass | 0 findings across 102 files, 394 rules. Exit code 0. Dockerfile missing-user-entrypoint finding resolved. |
| OWASP Dependency-Check (backend) | skipped | CI-only; requires NVD_API_KEY. No new dependencies; postgresql CVE resolved by upgrade. |

### Grype go-stdlib false-positive suppression rationale

All stdlib go1.20.12 CVEs reported by Grype are not actionable:

1. This project has no Go toolchain, no go.mod, and no compiled Go binary.
2. The only .go file in the tree is frontend/node_modules/.pnpm/flatted@3.4.2/node_modules/flatted/golang/pkg/flatted/flatted.go -- a Go source example bundled inside the flatted npm package, never compiled or executed.
3. Grype incorrectly inferred an active go1.20.12 runtime from this source file. Trivy scans the same manifests and reports 0 vulnerabilities.
4. A .grype.yaml suppression with rationale is recommended to prevent CI noise.

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | anyRequest().authenticated() covers all endpoints except OpenAPI/actuator health-info permit-list. All 5 /api/v1/clients endpoints require HTTP Basic auth. UUIDs non-guessable. All reads filtered by soft-delete predicate. |
| A02 | Cryptographic Failures | mitigated | No secrets committed. No MD5/SHA-1 for passwords. TLS at infra layer. No JWT/cookie secrets in scope. |
| A03 | Injection | mitigated | All JPQL uses named @Param bindings -- no string concatenation. Jakarta Validation on all request DTOs. Zod schemas mirror constraints on frontend. No dangerouslySetInnerHTML or eval() found. |
| A04 | Insecure Design | mitigated | RFC 7807 ProblemDetail for all errors (no stack trace to client). @Version optimistic locking. Page size clamped 1-100 server-side. Soft-delete for referential integrity. |
| A05 | Security Misconfiguration | mitigated | Actuator exposes health and info only. CSRF disabled -- appropriate for stateless HTTP Basic SPA API (ADR documented). CORS same-origin default correct for nginx-proxied SPA. nginx.conf lacks security headers (non-blocking recommendation). |
| A06 | Vulnerable & Outdated Components | mitigated | postgresql 42.7.11 -- CVE-2026-42198 (CVSS 7.5) resolved. Trivy: 0 H/C. pnpm audit: 0 H/C. Semgrep: 0 findings. Grype go-stdlib: false positives, no Go runtime. |
| A07 | Identification & Authentication | mitigated | HTTP Basic via Spring Security. Clean 401 via HttpStatusEntryPoint. No brute-force lockout -- acceptable for MVP (rate-limiting recommendation recorded). |
| A08 | Software & Data Integrity | mitigated | pom.xml and pnpm-lock.yaml committed. CI uses pnpm i --frozen-lockfile. @Version prevents lost-update races. |
| A09 | Security Logging & Monitoring | mitigated | ClientService logs UUID only at INFO. No PII in log statements. Full stack traces at ERROR server-side only; generic RFC 7807 message to client. No System.out in production code. |
| A10 | Server-Side Request Forgery | n/a | No outbound HTTP calls. No user-supplied URLs forwarded. nginx backend target is a static config constant. |

## Fixes verified from security iteration 1

- [x] postgresql upgraded to 42.7.11 -- postgresql.version property set in backend/pom.xml. Trivy confirms 0 CVEs. CVE-2026-42198 (CVSS 7.5) resolved.
- [x] Dockerfile non-root USER -- backend/Dockerfile stage 2 has addgroup/adduser and USER app before ENTRYPOINT. Semgrep missing-user-entrypoint rule passes (0 findings).

## Required fixes

None.

## Recommendations (non-blocking)

- [ ] Add .grype.yaml suppression for stdlib go1.20.12 false positives. Note: only Go file is vendored npm source example (flatted@3.4.2) with no active Go runtime. Expiry: 2026-08-12.
- [ ] Upgrade esbuild to >= 0.25.0 (GHSA-67mh-4wv8-2f99, CVSS 5.3 Moderate): dev-server CORS wildcard. pnpm update esbuild. No production impact. Expiry: 2026-06-12.
- [ ] Upgrade vite to >= 6.4.2 (GHSA-4w7w-66w2-5vf9, Moderate): .map path traversal with --host. pnpm update vite. No production impact. Expiry: 2026-06-12.
- [ ] Add HTTP security response headers to frontend/nginx.conf: Content-Security-Policy, X-Frame-Options: DENY, X-Content-Type-Options: nosniff, Referrer-Policy: strict-origin-when-cross-origin.
- [ ] Add authentication rate limiting before production launch (Bucket4j on /api/v1/**).
- [ ] Move Docker Compose dev credentials to .env with .env.example committed and .env in .gitignore.
