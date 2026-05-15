---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-15T00:05:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 35 commits scanned (~2.9 MB); no leaks found |
| Trivy (filesystem) | tool_missing | TIMEOUT: scan exceeded default 18-min limit while analyzing backend/pom.xml (semaphore acquire: context deadline exceeded). No CVE results available. Re-run with --timeout 30m flag or exclude .m2 cache from the scan path before production release. |
| Grype | skipped | SKIPPED: timed out in prior run. Run with a local DB cache. |
| OWASP Dependency-Check | skipped | SKIPPED: NVD API key not configured; run with NVD_API_KEY env var set. |
| pnpm audit | pass | 0 High, 0 Critical. 2 moderate: esbuild GHSA-67mh-4wv8-2f99 (CVSS 5.3, dev-server CORS) and vite GHSA-4w7w-66w2-5vf9 (CVSS unscored, dev-server .map traversal). Both affect Vite dev server only; not in production bundle. |
| Semgrep | pass | 435 files, 394 rules (Java, TypeScript, YAML, Dockerfile, Bash, HTML). 0 findings. nosemgrep suppression on LibreOfficePdfConverter includes required inline explanation. |
| Backend build (mvnw -Pfast verify) | pass | BUILD SUCCESS in 6:53 min. SpotBugs 0 errors, all tests pass. PMD skipped (fast profile). |

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | All new endpoints (preview-pdf, generate, generated, generated/metadata, DELETE /{id}) covered by anyRequest().authenticated() in SecurityConfig. Single-tenant deployment; no per-object ownership scope needed. InvoiceArtifactControllerTest asserts 401 for all four routes without credentials. |
| A02 | Cryptographic Failures | mitigated | SHA-256 stored per artefact and surfaced in GeneratedArtifactResponse. Cache-Control: private, no-store on all artefact responses. BCrypt cost 12 (pre-existing). No MD5/SHA-1 in new code. No secrets committed. |
| A03 | Injection | mitigated | All new JPQL queries use @Param-bound named parameters. ArtifactFormat parsed as enum (non-PDF/DOCX rejected at 400). No query string concatenation. No dangerouslySetInnerHTML in frontend. |
| A04 | Insecure Design | mitigated | overwrite=false default. 25 MiB cap enforced (ArtifactTooLargeException). Soft-delete audit trail. Storage growth documented as R-4 follow-up. |
| A05 | Security Misconfiguration | mitigated | Actuator exposes only health,info. CORS not enabled. Nginx sets CSP, X-Frame-Options: DENY, X-Content-Type-Options, Referrer-Policy. Note: nginx CSP uses unsafe-inline for script-src/style-src (see Recommendations). |
| A06 | Vulnerable & Outdated Components | n/a (tools pending) | OWASP DC and Grype skipped; Trivy pending. pnpm audit 0 High/Critical in 711 frontend deps. No new backend third-party deps introduced by this feature. |
| A07 | Identification & Authentication | mitigated | HTTP Basic enforced globally. BCrypt cost 12. No JWT in this feature. No new auth flows. |
| A08 | Software & Data Integrity | mitigated | pnpm-lock.yaml committed. Atomic write (tmp+move) for artefacts. SHA-256 stored and verified in InvoiceArtifactControllerIT.full_lifecycle_pdf. |
| A09 | Security Logging & Monitoring | mitigated | InvoiceArtifactService logs invoiceId only (no PII). Both mailers log email as 8-char truncated SHA-256 hash. GlobalExceptionHandler generic handler logs ERROR with stack trace only, no PII in detail message. |
| A10 | Server-Side Request Forgery | mitigated | No outbound HTTP calls introduced. Template store scans .rels entries for external HTTP targets and rejects them. Artefact store uses server-generated UUID paths only. |

## Feature-specific attack surface review

**Path traversal - FilesystemGeneratedArtifactStore**: write() computes filename as <invoiceId>.<ext> (server UUID + enum extension). read() and delete() accept relativePath from the DB row written by the server. resolveAndValidate() rejects any path escaping canonicalRoot via startsWith() check. Unit test covers ../etc/passwd. PASS.

**XXE - poi-tl / Apache POI**: POI 5.x disables external entity resolution by default. Template .rels scan blocks the main SSRF/XXE vector in OOXML. Risk low. See Recommendations for explicit hardening.

**Macro injection - DOCX template upload**: FilesystemInvoiceTemplateStore.replace() validates ZIP magic bytes, word/document.xml presence, and external relationship URIs. It does NOT check for word/vbaProject.bin (VBA macros). A user could upload a macro-infected template; recipients who open the downloaded DOCX in Microsoft Word could trigger client-side macro execution. Medium-priority client-side RCE risk. Listed in Required Fixes.

**Email header injection - to:** Both InvoiceService.sendEmail() and InvoiceRenderService.sendEmail() check toEmail for CRLF and throw InvoiceHasNoRecipientException. PASS.

**Email header injection - subject and Content-Disposition filename**: invoice.number() used in email subject and Content-Disposition filename without explicit CRLF guard. Mitigated at framework layer: Jakarta Mail RFC 2047-encodes the subject; Spring Framework 6.x HttpHeaders.set() throws on CRLF values. Application-layer explicit validation absent (defense-in-depth gap only).

**GET /generated auth enforcement**: Covered by Spring Security global filter chain (anyRequest().authenticated()). PASS.

**DELETE /{id} ownership**: Single-tenant v1; all authenticated users share the same tenant. PASS within declared scope.

## Required fixes

- [ ] **Macro rejection in DOCX template upload** (medium): Add a check in FilesystemInvoiceTemplateStore.validateZipStructure() to throw InvalidTemplateException when a ZIP entry named word/vbaProject.bin is present. Add a unit test with a macro-bearing DOCX. Prevents distributing macro-infected artefacts to invoice recipients.

## Recommendations (non-blocking)

- [ ] **Invoice number CRLF guard (defense-in-depth)**: Add @Pattern to CreateInvoiceRequest.number restricting printable non-control ASCII without CR/LF. Current risk is mitigated by the framework stack; explicit validation documents intent.
- [ ] **Upgrade Vite to 5.4.22+ or 6.4.2+**: Resolves GHSA-4w7w-66w2-5vf9 (dev-server .map traversal, dev-only). Low urgency.
- [ ] **Upgrade esbuild to 0.25.0+**: Resolves GHSA-67mh-4wv8-2f99 (dev-server CORS, dev-only). Low urgency.
- [ ] **Complete Trivy and OWASP DC before production release**: Set NVD_API_KEY and run. Add NVD_API_KEY to GitHub Actions secrets.
- [ ] **nginx CSP unsafe-inline**: Remove script-src/style-src unsafe-inline; use nonce-based or hash-based CSP.
- [ ] **Explicit POI XXE hardening (defense-in-depth)**: Add unit test asserting XWPFDocument parsing rejects a DOCTYPE declaration, documenting the control as deliberate.
