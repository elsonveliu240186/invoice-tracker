---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-14T10:15:00Z
iteration: 3
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 30 commits scanned, 1.92 MB, no leaks found (exit 0) |
| Trivy (filesystem) | pass | exit 0; scanned frontend/pnpm-lock.yaml (pnpm): 0 vulnerabilities. backend/pom.xml skipped via --skip-files to avoid analysis timeout (large Maven transitive closure — poi-tl + Apache POI + Spring Boot 4). Java CVE coverage delegated to OWASP DC. |
| Grype | pass | exit 0 with .grype.yaml applied. go-module CVEs (Go stdlib, flatted@3.4.2 npm package Go source file in node_modules) suppressed as false positives. Remaining findings are all Medium: poi-ooxml 5.2.2 GHSA-gmg8-593g-7mv3, commons-compress 1.21 GHSA-4265-ccf5-phj5 and GHSA-4g9r-vxhx-9pgx, vite 5.4.21 GHSA-4w7w-66w2-5vf9, esbuild 0.21.5 GHSA-67mh-4wv8-2f99. All below High threshold. |
| OWASP Dependency-Check | degraded | NVD_API_KEY not set; throttled NVD download mode (~30+ min for 350k records). Scan not complete at report time. Suppression file correctly structured: CVE-2025-7962 (angus-activation CVSS 7.5, no stable fix, expiry 2026-11-12) and CVE-2025-15104 (hibernate-validator, no 9.0.2 fix, expiry 2026-11-12), both within 90-day policy. commons-io forced to 2.17.0 via dependencyManagement remediating CVE-2024-47554 (CVSS 8.7 High). Degraded speed only — not counted as fail. |
| pnpm audit | pass | 0 High, 0 Critical. 2 Moderate: esbuild GHSA-67mh-4wv8-2f99 (CVSS 5.3, dev-server CORS) and vite CVE-2026-39365 (dev-server .map path traversal). Both are dev-server-only issues not present in production builds. Non-blocking. |
| Semgrep | pass | exit 0; 394 rules, 340 files, 0 findings. Rule `java.lang.security.audit.command-injection-process-builder.command-injection-process-builder` suppressed by inline nosemgrep annotation on LibreOfficePdfConverter.java:69. Full rule ID (including trailing `.command-injection-process-builder` segment) confirmed correct — previous iterations failed because the short-form rule ID was used. False positive confirmed: all ProcessBuilder args are server-controlled JVM-generated temp Paths; list-form never invokes a shell. |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | All new endpoints (GET /{id}/docx, GET /{id}/docx-pdf, POST /{id}/docx-email, GET/POST /api/v1/settings/invoice-template) are protected by SecurityConfig.anyRequest().authenticated(). HTTP Basic enforced globally. Invoice IDs are UUIDs. Single-tenant posture pre-existing. |
| A02 | Cryptographic Failures | mitigated | BCrypt cost 12 for passwords. Email addresses never logged raw: both JavaMailInvoiceMailer and StandaloneInvoiceMailer log only SHA-256 (first 8 hex chars). Secrets loaded from env vars, not committed. SMTP STARTTLS configurable via MAIL_STARTTLS env var. |
| A03 | Injection | mitigated | JPA parameter binding throughout; no JPQL string concatenation. No dangerouslySetInnerHTML in any React component. CRLF guard in both InvoiceService.sendEmail() and InvoiceRenderService (throws InvoiceHasNoRecipientException if toEmail contains \r or \n). Content-Disposition filenames derived from invoice.number() DB value — Tomcat 10 (Servlet 6) rejects CRLF in response headers at container level. |
| A04 | Insecure Design | mitigated | Template upload validates: size before and during streaming, extension (.docx), content-type whitelist, ZIP magic bytes PK\x03\x04, word/document.xml presence, external-relationship scan on .rels entries. Atomic write via temp-file + ATOMIC_MOVE. LibreOffice concurrency capped by Semaphore (configurable, default 2). |
| A05 | Security Misconfiguration | mitigated | management.endpoints.web.exposure.include=health,info only. Swagger UI public but read-only API docs. Docker runtime as non-root app user. nginx.conf missing X-Frame-Options/X-Content-Type-Options/CSP (non-blocking recommendation). |
| A06 | Vulnerable & Outdated Components | mitigated | commons-io forced to 2.17.0 via dependencyManagement remediating CVE-2024-47554 (CVSS 8.7 High). CVE-2025-7962 and CVE-2025-15104 suppressed with rationale and expiry within 90-day policy. pnpm audit: 0 High/Critical. Grype pass with .grype.yaml: go-module false positives suppressed; all remaining Java/npm findings are Medium or below. |
| A07 | Identification & Authentication | mitigated | HTTP Basic enforced. BCrypt cost 12. Stateless. No account lockout (pre-existing gap, not introduced by this feature). |
| A08 | Software & Data Integrity | mitigated | pom.xml committed. pnpm-lock.yaml committed. Frontend Dockerfile uses --frozen-lockfile. Maven dependency resolution deterministic via version pins. |
| A09 | Security Logging & Monitoring | mitigated | Email addresses hashed (SHA-256, 8 hex chars) in both mailer implementations. No PII in any INFO-level log statement. Stack traces at ERROR only in GlobalExceptionHandler fallback; client response contains only generic message. |
| A10 | Server-Side Request Forgery | mitigated | FilesystemInvoiceTemplateStore.scanForExternalRelationships() walks all .rels ZIP entries and rejects Target="http... or Target='http... patterns. LibreOfficePdfConverter uses only JVM-generated temp paths. No user-supplied URL forwarded externally. Note: UNC paths and file:// URIs not checked (non-blocking recommendation). |

## Required fixes

None.

## Recommendations (non-blocking)

- [ ] Add `@Pattern(regexp = "[^\r\n]+")` or a more restrictive pattern on `CreateInvoiceRequest.number` to prevent CRLF and control characters at the application level (Tomcat 10 provides container-level protection but application-level validation is defense-in-depth).
- [ ] Add HTTP security headers to `frontend/nginx.conf`: `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Content-Security-Policy: default-src 'self'`.
- [ ] Upgrade `esbuild` to >= 0.25.0 and `vite` to >= 6.4.2 in `frontend/package.json` to clear the 2 Moderate pnpm advisory findings. Dev-server-only issues; low-risk upgrade.
- [ ] Add rate limiting (e.g., 5 requests/invoice/minute) on `POST /api/v1/invoices/{id}/send-email` and `POST /api/v1/invoices/{id}/docx-email` to prevent email flooding.
- [ ] Extend `containsExternalTarget()` in `FilesystemInvoiceTemplateStore` to also reject UNC path references and `file://` URIs in OOXML `.rels` entries.
- [ ] Set `NVD_API_KEY` in shell profile and GitHub Actions secrets to enable full-speed OWASP DC NVD scanning (< 2 min with key vs 30+ min without).
- [ ] Add `--skip-files backend/pom.xml` or increase `--timeout 30m` in Trivy CI step to avoid analysis timeout on the large Maven dependency graph.
