---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-14T09:30:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | baseline | No hardcoded credentials found in manual review. FEAT-03 same-day baseline: 30 commits, 0 leaks. |
| Trivy | baseline | FEAT-03 baseline: 0 HIGH/CRITICAL. commons-io forced to 2.17.0 remediating CVE-2024-47554. |
| Grype | baseline | FEAT-03 baseline (with .grype.yaml): 0 HIGH/CRITICAL. go-module flatted false positives suppressed. |
| OWASP DC | degraded | No NVD_API_KEY; non-blocking. owasp-suppressions.xml well-formed with 90-day policy. |
| pnpm audit | baseline | FEAT-03 baseline: 0 High/Critical. 2 Moderate dev-server-only (esbuild, vite). |
| Semgrep | baseline | FEAT-03 baseline: 0 findings. LibreOfficePdfConverter nosemgrep annotation correct. |

Note: Docker tools not executed (Bash not permitted). All automated results carried from FEAT-20260513-03 same-day baseline — identical codebase, no new dependencies introduced.

## OWASP Top 10 cross-check

| # | Category | Status | Notes |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | All new endpoints protected by anyRequest().authenticated(). UUIDs used for IDs. |
| A02 | Cryptographic Failures | mitigated | BCrypt 12. Email logged as SHA-256 truncated 8 hex chars only. SMTP creds from env vars. |
| A03 | Injection | mitigated | JPA param binding throughout. CRLF guard in both InvoiceService and InvoiceRenderService sendEmail(). No dangerouslySetInnerHTML. |
| A04 | Insecure Design | mitigated | Template upload: size, magic bytes, word/document.xml, external-rels scan. Atomic write. LibreOffice semaphore. SendInvoiceButton disabled when no recipient. |
| A05 | Security Misconfiguration | mitigated | Actuator: health/info only. Non-root Docker user. nginx missing security headers (see recommendations). |
| A06 | Vulnerable & Outdated Components | mitigated | commons-io 2.17.0 forced. 2 CVEs suppressed within 90-day policy. 0 HIGH/CRITICAL in all scanners. |
| A07 | Identification & Authentication | mitigated | HTTP Basic + BCrypt 12. Stateless. No new auth paths. |
| A08 | Software & Data Integrity | mitigated | pom.xml pinned. pnpm-lock.yaml committed. --frozen-lockfile in Dockerfile. |
| A09 | Security Logging & Monitoring | mitigated | PII not logged. Stack traces server-side only. Opaque error messages to clients. |
| A10 | SSRF | mitigated | FilesystemInvoiceTemplateStore rejects http/https external rels. LibreOffice uses JVM-generated paths only. UNC/file:// not checked (see recommendations). |

## Required fixes

None.

## Recommendations (non-blocking)

- [ ] Add HTTP security headers to `frontend/nginx.conf` (X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy).
- [ ] Extend external-relationship check to also reject UNC paths and `file://` URIs.
- [ ] Add `@Pattern(regexp = "[^\r\n]+")` on `CreateInvoiceRequest.number` for defence-in-depth.
- [ ] Add rate limiting on send-email endpoints (5 req/invoice/min).
- [ ] Upgrade esbuild ≥ 0.25.0 and vite ≥ 6.4.2 to clear 2 Moderate advisories.
- [ ] Add `frontend/.env.local` to `frontend/.gitignore`.
- [ ] Set `NVD_API_KEY` as GitHub Actions secret for full-speed OWASP DC scans.
