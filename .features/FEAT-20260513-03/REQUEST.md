# Invoice Export — template-based PDF & DOCX generation, email delivery, local download

## Summary

Generate professional invoices from user-managed templates. Two independent export formats:
- **PDF** — HTML+CSS template rendered via OpenHTMLtoPDF (pure JVM, no container dependency)
- **DOCX** — DOCX template merged via poi-tl

Templates are stored in the database (not filesystem) to work correctly in containerised deployments.
Users can choose from bundled themes or upload a custom template for each format.

---

## Detailed requirements

### Template management

1. **Two template slots**: one for PDF (HTML/CSS), one for DOCX (`.docx` file).
2. **Built-in themes** — bundle 2 themes for each format:
   - `classic` — clean, professional, black-and-white
   - `modern` — colour accent bar, logo placeholder, compact line-item table
3. **Custom upload** — `POST /api/v1/settings/invoice-template/pdf` (HTML file, max 100 KB) and `POST /api/v1/settings/invoice-template/docx` (`.docx` file, max 5 MB). Stored as blob in `invoice_templates` table with columns: `id`, `format` (PDF/DOCX), `name`, `content` (bytea), `is_active`, `uploaded_at`, `uploaded_by`.
4. **Preview endpoint** — `GET /api/v1/settings/invoice-template/{format}/preview` renders the active template with a hardcoded sample invoice and streams the resulting PDF or DOCX. No auth bypass — the sample data never contains real invoice data.
5. **Template switching** — `PUT /api/v1/settings/invoice-template/{format}/active?name={name}` sets a named (built-in or custom) template as active.

### PDF generation

6. Engine: **OpenHTMLtoPDF** (`com.openhtmltopdf:openhtmltopdf-pdfbox`). The active HTML template is a Thymeleaf template processed server-side before being passed to the PDF renderer.
7. Template variables (Thymeleaf `${…}` syntax):
   - `${invoice.number}`, `${invoice.issueDate}`, `${invoice.dueDate}`, `${invoice.status}`
   - `${client.name}`, `${client.email}`, `${client.address}`
   - `${company.name}`, `${company.address}`, `${company.logoUrl}`
   - `${lines}` (list of `{description, qty, unitPrice, lineTotal}`)
   - `${invoice.subtotal}`, `${invoice.taxRate}`, `${invoice.taxAmount}`, `${invoice.total}`
   - `${invoice.notes}`, `${invoice.currency}`, `${invoice.locale}`
8. **DRAFT / PAID watermarks** — if `invoice.status == DRAFT` render a diagonal "DRAFT" watermark; if `PAID` render "PAID" in green. Implemented via CSS `@page` / `::before` in the HTML template.
9. **QR code** — embed a QR code in the PDF footer linking to `${app.publicBaseUrl}/pay/${invoice.number}` (placeholder URL). Use `com.google.zxing:core` + `javase`. Can be disabled via `app.invoice.pdf.qr-code-enabled=false`.
10. **Sequential invoice numbering** — format `${app.invoice.numberPrefix}-${year}-${seq}` e.g. `INV-2026-001`. Prefix and separator configurable. Sequence is a DB-managed auto-increment per year.
11. Endpoint: `GET /api/v1/invoices/{id}/pdf` — HTTP Basic auth, streams `application/pdf`, `Content-Disposition: inline; filename="invoice-<number>.pdf"`.

### DOCX generation

12. Engine: **poi-tl** (`com.deepoove:poi-tl`) — merges invoice data into the active `.docx` template using `{{field}}` and `{{#table}}` syntax.
13. Template variables mirror the PDF set but use poi-tl syntax: `{{invoice.number}}`, `{{client.name}}`, `{{#lines}}` table loop, etc.
14. Watermarks and QR code are **not** required in the DOCX output (DOCX is an editable format — watermarks would be removed by the client anyway).
15. Endpoint: `GET /api/v1/invoices/{id}/docx` — HTTP Basic auth, streams `application/vnd.openxmlformats-officedocument.wordprocessingml.document`, `Content-Disposition: attachment; filename="invoice-<number>.docx"`.

### Sharing

16. **Download locally** — invoice detail page has a "Download" dropdown: "Download as PDF" and "Download as DOCX".
17. **Send by email** — "Send to Client" emails the PDF as attachment to the client's registered email.
    - If FEAT-20260513-02's `InvoiceMailer` bean is present: reuse it.
    - Otherwise: implement a standalone `TemplateInvoiceMailer` using `JavaMailSender` with the same SMTP env-var convention as FEAT-02.
18. No Google Doc integration, no WhatsApp link, no public share-link tokens (all explicitly out of scope).

### Frontend

19. Invoice detail page:
    - "Download" dropdown: "Download as PDF" / "Download as DOCX" (loading spinner per option while request is in flight; failure toast on error).
    - "Send to Client" button — emails PDF; shows "Sent on …" badge from `lastSentAt`.
20. Settings page — "Invoice Templates" section:
    - Tabs: PDF | DOCX
    - Per tab: theme selector (radio cards showing thumbnail screenshots of Classic / Modern), custom upload field, "Preview" button (opens rendered preview in a Dialog).
    - Current active template name + upload date shown.

### Quality & non-goals

21. Backend JaCoCo gate: ≥ 90% line + branch. Frontend coverage: ≥ 95/95/95/90.
22. Playwright E2E: `tests/invoices/export.spec.ts` — PDF download (assert `application/pdf`, size ≥ 1 KB), DOCX download (assert OOXML magic bytes `PK\x03\x04`), template preview round-trip, send-email (via MailHog).
23. All new strings in `en.json` under `invoice.export.*` and `settings.templates.*`.
24. OpenAPI `@Operation` annotations on all new controllers. Postman collection updated.
25. No PII in logs at INFO level. QR code URL is not PII.

### Out of scope

- Google Doc / Drive integration
- WhatsApp share links
- Public share-link / token endpoints
- DOCX → PDF conversion (the two formats are independent)
- Invoice list UI (sidebar link shows EmptyState until a list feature ships)
