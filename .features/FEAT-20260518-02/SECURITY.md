---
status: pass
auditor: claude-sonnet
generated_at: 2026-05-18T08:30:00Z
---

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | mitigated | `SecurityConfig.anyRequest().authenticated()` covers `/api/v1/settings/company`. `AuthRateLimitFilter` applied to all `/api/v1/**`. Both GET and PUT require HTTP Basic. 401 on anonymous confirmed in `CompanyProfileControllerTest`. |
| A02 | Cryptographic Failures | n/a | No new crypto operations. Passwords BCrypt cost 12. No secrets committed. |
| A03 | Injection | mitigated | All persistence via Spring Data JPA — no JPQL/SQL string concatenation. `@NotBlank`+`@Size(max=200)` on name; `@OptionalEmail`+`@Size(max=254)` on email (regex rejects `\r\n` via `\s`). SMTP Subject: `MimeMessageHelper("UTF-8")` Q-encodes header values, encoding CRLF as `=0D=0A`. DOCX text cells are safe sinks. No `dangerouslySetInnerHTML` in frontend. |
| A04 | Insecure Design | mitigated | Singleton table with `CHECK (id = 1)`. `@Version` optimistic lock on `CompanyProfileEntity`. `GlobalExceptionHandler` maps `OptimisticLockingFailureException` → 409. `EntityManager.find()` pattern avoids `NonUniqueObjectException`. |
| A05 | Security Misconfiguration | mitigated | New endpoint inherits CSRF-disabled stateless HTTP Basic posture. No new actuator endpoints, CORS rules, or env exposure. |
| A06 | Vulnerable Components | mitigated | No new backend or frontend dependencies introduced by this feature. `commons-io` forced to 2.17.0 (CVE-2024-47554). All existing suppressions valid and within policy. |
| A07 | Identification & Auth | mitigated | `AuthRateLimitFilter` (bucket4j) rate-limits `/api/v1/**`. BCrypt cost 12. Stateless — no session. |
| A08 | Software & Data Integrity | mitigated | `pnpm-lock.yaml` committed and unchanged by this feature. `pom.xml` versions pinned. |
| A09 | Logging & Monitoring | mitigated | `CompanyProfileService.update()` logs field-name list only — never values (PII/VAT/IBAN). `GlobalExceptionHandler` fallback at ERROR, no stack trace in HTTP response. |
| A10 | SSRF | n/a | No outbound HTTP calls, no user-supplied URLs forwarded. |

## Required fixes

None.

## Recommendations (non-blocking)

- [ ] Add `@Pattern(regexp = "[A-Z0-9 ]*")` to `iban` and `swiftBic` in `CompanyProfileRequest` — plan section 9 states this; implementation omits it. Currently low-risk (safe sinks), but closes the gap if fields are ever used in header/template contexts.
- [ ] Add explicit CRLF strip on `companyName` in `JavaMailInvoiceMailer.buildSubject()` as defence-in-depth. JavaMail UTF-8 encoding already mitigates the risk, but an explicit guard is consistent with existing CRLF guards in `InvoiceRenderService`.
- [ ] Add `// unreachable after V14 migration seeds row` comment on `orElseGet(CompanyProfileEntity::new)` branch in `CompanyProfileRepositoryAdapter.save()`.
