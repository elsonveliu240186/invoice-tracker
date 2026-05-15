# FEAT-20260513-02 — Documentation summary

**Feature**: Invoice PDF generation and email delivery to clients
**State transition**: Documenting → Shipping
**Documented at**: 2026-05-14T10:30:00Z
**Documentation agent**: claude-sonnet-4-6

---

## Files changed by this documentation pass

### docs/CHANGELOG.md

Prepended a new `### Added` entry under `[Unreleased]` for FEAT-20260513-02. The entry covers:
- Full `Invoice` domain introduction (Flyway V4, two tables, soft-delete, partial unique index, `last_sent_at`)
- Five REST endpoints at `/api/v1/invoices`
- `OpenPdfInvoiceRenderer` (OpenPDF 2.0.3, BSD/LGPL)
- `JavaMailInvoiceMailer` — SMTP-success-only `last_sent_at` write, `502 EMAIL_DELIVERY_FAILED` on failure
- `422 INVOICE_HAS_NO_RECIPIENT` guard
- CRLF injection guard and SHA-256-truncated email logging
- MailHog docker-compose service
- Frontend: `ViewPdfButton`, `SendInvoiceButton`, `InvoiceSentBadge`, `InvoiceDetailPage`
- Quality gate results and review iteration count (5 iterations, 4 failures)

### docs/FEATURES.md

- Added row for FEAT-20260513-02 (state: Shipping) to the feature table, inserted between FEAT-20260513-03 and FEAT-20260513-01.
- Added a full `## FEAT-20260513-02` detail section with: overview, backend changes, frontend changes, quality gate table, and risk register.

### docs/SEQUENCE_DIAGRAMS.md

Appended `### FEAT-20260513-02 — Invoice PDF generation and email delivery to clients` section with two mermaid sequence diagrams copied from PLAN.md §4:
- 4a Happy path: render PDF + send email (View PDF → iframe; Send to Client → toast + badge)
- 4b Edge case: SMTP failure does not persist `last_sent_at` (502, badge unchanged)

### docs/ARCHITECTURE.md

- Updated the Backend C4 level-3 header comment to credit FEAT-20260513-02 for adding `InvoiceController`, `InvoiceService`, `OpenPdfInvoiceRenderer`, `JavaMailInvoiceMailer`, and `InvoiceRepositoryAdapter`.
- Updated the Frontend component diagram header to credit FEAT-20260513-02.
- Added `InvoicesFeature` subgraph to the frontend flowchart (`InvoiceDetailPage`, `ViewPdfButton`, `SendInvoiceButton`, `InvoiceSentBadge`, `invoicesApi.ts`, `useInvoice`/`useSendInvoice`, zod schemas) and wired it from the router (`/invoices/:id`).
- Added **ADR-017** — OpenPDF 2.0.3 chosen over iText 7 (AGPL) and JasperReports (heavyweight).
- Added **ADR-018** — MailHog as local SMTP relay; all SMTP credentials from env vars only; `local` profile STARTTLS exemption documented.

### docs/SECURITY.md

Appended a row to the History table for FEAT-20260513-02: security audit passed on the FEAT-03 same-day baseline (0 required fixes, 7 non-blocking recommendations — nginx headers, UNC/file:// check, `@Pattern` on invoice number, rate limiting, esbuild/vite upgrade, `.env.local` gitignore, NVD_API_KEY secret).

### docs/openapi.json

Updated the `info.description` field to note that the spec was hand-constructed across both FEAT-20260513-02 and FEAT-20260513-03, and lists the endpoint groups it covers. No path or schema changes were needed — the FEAT-03 documentation pass had already included all FEAT-02 invoice paths (`POST /api/v1/invoices`, `GET /api/v1/invoices`, `GET /api/v1/invoices/{id}`, `GET /api/v1/invoices/{id}/pdf`, `POST /api/v1/invoices/{id}/send-email`) and the `InvoiceResponse` schema with `clientEmail` and `lastSentAt`.

---

## Files NOT changed (already correct from FEAT-03 pass)

| File | Reason |
|------|--------|
| `docs/API.md` | Already contains complete Invoices section with all five FEAT-02 endpoints, request/response schemas, error codes, and the `InvoiceSentBadge` / `ViewPdfButton` integration notes. |
| `docs/openapi.json` — paths | All FEAT-02 invoice paths and schemas (`CreateInvoiceRequest`, `InvoiceLineDto`, `InvoiceResponse` with `clientEmail`, `InvoicePage`, `SendEmailResponse`) were already present and correct. |
| `postman/collection.json` | Regenerated during FEAT-03 pass; FEAT-02 invoice endpoints are included in the collection. |
| `postman/local-dev.environment.json` | No new `{resourceId}` variables required; `invoiceId` was already present from FEAT-03 pass. |

---

## Conflicts and reconciliation with FEAT-03 docs

FEAT-20260513-03 was documented first and its documentation pass included all FEAT-02 invoice endpoints (because both features were developed in sequence on the same codebase). The following potential conflicts were checked and resolved:

| Item | Status |
|------|--------|
| `/api/v1/invoices/{id}/pdf` path in openapi.json | Correct — tagged `Invoices` (FEAT-02), not `Invoice Rendering` (FEAT-03). No conflict. |
| `POST /api/v1/invoices/{id}/send-email` vs `POST /api/v1/invoices/{id}/docx-email` | Distinct paths, distinct operationIds (`sendInvoiceEmail` vs `sendInvoiceDocxEmail`). No conflict. |
| FEAT-03 FEATURES.md section mentions `@Primary`/`@ConditionalOnMissingBean` arbitration with FEAT-02 | The FEAT-02 section added here (R-5) mirrors this from the FEAT-02 perspective. Consistent. |
| CHANGELOG.md ordering | FEAT-03 entry appears first (as it was documented first); FEAT-02 entry is prepended above it. Both under `[Unreleased]`. |

---

## Quality gate summary (FEAT-02)

| Gate | Result |
|------|--------|
| JaCoCo line + branch | ≥ 90% — pass (180 unit + 27 IT) |
| Vitest statements | 97.33% — pass (gate 95%) |
| Vitest branches | 91.69% — pass (gate 90%) |
| Vitest functions | 96.53% — pass (gate 95%) |
| Vitest lines | 97.33% — pass (gate 95%) |
| pnpm lint | 0 errors — pass |
| pnpm audit | 0 high / 0 critical — pass |
| Playwright E2E | 44 / 44 — pass |
| Security | 0 required fixes — pass |
