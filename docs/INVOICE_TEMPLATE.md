# Invoice Template Placeholder Catalogue

Maintained by the **documentation** subagent. Last updated by FEAT-20260518-02.

The `PoiTlInvoiceDocxRenderer` uses [poi-tl](https://deepoove.com/poi-tl/) to substitute `{{token}}` placeholders in an uploaded `.docx` template. This page lists every token the renderer populates, the fallback behaviour when a value is absent, and the `{{lines}}` table-loop convention.

---

## Company tokens

Company values are resolved by `CompanyProfileResolver` in the following priority order:

1. Persisted `company_profile` row (updated via `PUT /api/v1/settings/company`)
2. Static `app.company.*` YAML properties (deployment-time defaults)
3. Empty string (renderer never sees a null)

### Nested form (`{{company.*}}`)

| Token | Maps to | Notes |
|-------|---------|-------|
| `{{company.name}}` | `CompanyProfile.name` | Company trading name |
| `{{company.address}}` | `CompanyProfile.address` | Full postal address |
| `{{company.phone}}` | `CompanyProfile.phone` | Contact phone number |
| `{{company.email}}` | `CompanyProfile.email` | Billing e-mail address |
| `{{company.vatNumber}}` | `CompanyProfile.vatNumber` | VAT / tax registration number |
| `{{company.iban}}` | `CompanyProfile.iban` | IBAN (charset `[A-Z0-9 ]`) |
| `{{company.swiftBic}}` | `CompanyProfile.swiftBic` | SWIFT / BIC code |
| `{{company.bankName}}` | `CompanyProfile.bankName` | Bank name |

### Flat alias form

For templates created before the nested API was introduced, or for simpler readability, the renderer also exposes flat aliases. Both forms resolve to identical values.

| Token | Equivalent nested token |
|-------|------------------------|
| `{{companyName}}` | `{{company.name}}` |
| `{{companyAddress}}` | `{{company.address}}` |
| `{{companyPhone}}` | `{{company.phone}}` |
| `{{companyEmail}}` | `{{company.email}}` |
| `{{companyVatNumber}}` | `{{company.vatNumber}}` |
| `{{companyIban}}` | `{{company.iban}}` |
| `{{companySwiftBic}}` | `{{company.swiftBic}}` |
| `{{companyBankName}}` | `{{company.bankName}}` |

---

## Client tokens

Client values come from the `clients` table row linked to the invoice. All fields are sourced from the `ClientResponse` at render time; they are never snapshot-overridden.

| Token | Source field | Notes |
|-------|-------------|-------|
| `{{client.name}}` | `Client.name` | Client company or individual name |
| `{{client.email}}` | `Client.email` | Client billing e-mail |
| `{{client.phone}}` | `Client.phone` | Client phone number |
| `{{client.address}}` | `Client.address` | Client postal address |
| `{{clientName}}` | alias for `{{client.name}}` | |
| `{{clientEmail}}` | alias for `{{client.email}}` | |
| `{{clientPhone}}` | alias for `{{client.phone}}` | |
| `{{clientAddress}}` | alias for `{{client.address}}` | |

---

## Invoice header tokens

Invoice values come from the `invoices` table. Where snapshot columns exist on the invoice (introduced by Flyway V10), they take precedence over the live client / company data at the service layer before the template context is assembled.

| Token | Source field | Notes |
|-------|-------------|-------|
| `{{invoice.number}}` | `Invoice.number` | Invoice reference number (e.g. `INV-2026-001`) |
| `{{invoice.issueDate}}` | `Invoice.issueDate` | ISO date `YYYY-MM-DD` formatted by locale setting |
| `{{invoice.dueDate}}` | `Invoice.dueDate` | ISO date `YYYY-MM-DD` |
| `{{invoice.status}}` | `Invoice.status` | `DRAFT`, `SENT`, or `PAID` |
| `{{invoice.taxRate}}` | `Invoice.taxRate` | Decimal fraction (e.g. `0.20`) |
| `{{invoice.subtotal}}` | Computed | Sum of `quantity × unitPrice` across all lines |
| `{{invoice.taxAmount}}` | Computed | `subtotal × taxRate` |
| `{{invoice.total}}` | Computed | `subtotal + taxAmount` |
| `{{invoiceNumber}}` | alias for `{{invoice.number}}` | |
| `{{invoiceIssueDate}}` | alias for `{{invoice.issueDate}}` | |
| `{{invoiceDueDate}}` | alias for `{{invoice.dueDate}}` | |
| `{{invoiceSubtotal}}` | alias for `{{invoice.subtotal}}` | |
| `{{invoiceTaxRate}}` | alias for `{{invoice.taxRate}}` | |
| `{{invoiceTaxAmount}}` | alias for `{{invoice.taxAmount}}` | |
| `{{invoiceTotal}}` | alias for `{{invoice.total}}` | |

---

## Line-items table — `{{lines}}` loop convention

The renderer uses `LoopRowTableRenderPolicy` from poi-tl to expand a template table row for each invoice line. Place `{{lines}}` as the **only content** in a table row that should be repeated. The following tokens are available within each repeated row.

### Table structure example

| # | Description | Qty | Unit Price | Line Total |
|---|-------------|-----|------------|------------|
| `{{lines}}` | `{{description}}` | `{{quantity}}` | `{{unitPrice}}` | `{{lineTotal}}` |

### Line-item tokens (available inside the `{{lines}}` row only)

| Token | Source | Notes |
|-------|--------|-------|
| `{{description}}` | `InvoiceLine.description` | Free-text description of the service or product |
| `{{quantity}}` | `InvoiceLine.quantity` | Numeric quantity (integer or decimal) |
| `{{unitPrice}}` | `InvoiceLine.unitPrice` | Unit price formatted to 2 decimal places |
| `{{lineTotal}}` | Computed | `quantity × unitPrice`, 2 decimal places |

> The `{{lines}}` trigger token itself is replaced by poi-tl and does not appear in the merged output. It must occupy its own table cell to act as the loop anchor.

---

## Unresolved tokens

The renderer is configured with `Configure.ClearHandler` so any `{{token}}` that is not in the context map above is silently removed rather than left as literal text. This prevents `[Company Name]` literal strings from appearing in generated documents if a template pre-dates this feature.

---

## Bundled default template

The repository ships a default template at `backend/src/main/resources/templates/invoice-template.docx`. Since FEAT-20260518-02 this template uses the `{{...}}` tokens listed above rather than `[placeholder]` literals. To inspect or modify it:

1. Download via `GET /api/v1/settings/invoice-template/download`.
2. Edit with Microsoft Word or LibreOffice Writer.
3. Re-upload via `POST /api/v1/settings/invoice-template` (multipart, field name `file`).

VBA macros are rejected at upload time (`415 INVALID_TEMPLATE_TYPE`). External relationship references (HTTP/HTTPS URLs inside the DOCX XML) are also rejected (SSRF guard).
