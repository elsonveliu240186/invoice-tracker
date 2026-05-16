# invoice-creation-form-company-profile-and-ux-overhaul

## User request

The current implementation has several fundamental UX problems (screenshot attached showing the issues):

### Problem 1 — "Manage Template" wrongly placed in sidebar under Invoices
The sidebar shows "Manage template" as a child of Invoices. It should ONLY live under Settings. Remove it from the Invoices nav section.

### Problem 2 — No invoice creation form
There is no "New Invoice" button or form. The invoice list should have a "New Invoice" button (like Clients has "New client"). Clicking it opens a form/sheet with:
- **Client selector** (dropdown of existing clients) — selecting a client auto-fills client.name, client.email, client.phone, client.address
- **Company info** auto-filled from company profile settings (company.name, company.email, company.phone, company.address)
- **Invoice number** — auto-generated (sequential, e.g. INV-2026-0001), editable
- **Issue date** and **Due date** (date pickers)
- **Line items table** — add/remove rows, each row: description, quantity, unit price, line total (calculated)
- **Subtotal**, **tax rate** (%), **total** — all calculated automatically
- Save as DRAFT, then actions on the invoice detail page

### Problem 3 — Client form missing phone and address
When creating/editing a client, there are no fields for `phone` and `address`. These must be added so the data is available for invoice auto-fill.

### Problem 4 — Company profile settings missing
There is no company profile settings page. Need a new Settings page: **Company Profile** with fields:
- Company name
- Company email
- Company phone
- Company address

This data is stored in the DB (a single-row `company_profile` table) and returned via `GET /api/v1/settings/company` + `PUT /api/v1/settings/company`. When creating an invoice, the backend auto-fills `{{company.*}}` placeholders from this table.

### Problem 5 — Placeholder reference card should be removed from template manager
The `PlaceholderReferenceCard` showing chip tags ({{company.name}}, {{client.name}}, etc.) should be removed from the Manage Template page. It is confusing — users do not need to manually copy placeholders into a form. The template is a DOCX file they upload; placeholders are already in the DOCX.

### Problem 6 — Invoice detail page actions
Once an invoice is created (DRAFT status), the detail page must show:
- **Edit** button — opens the same invoice form pre-filled
- **Delete** button — with confirmation dialog
- **Preview** — existing PDF preview (keep)
- **Generate & Save** — existing generate button (keep)
- **Send by email** — existing send button (keep)
- **Mark as Paid** — existing button (keep)

### Summary of placeholder data flow
- `{{company.*}}` — auto-filled from company profile in DB (no user input needed on invoice form)
- `{{client.*}}` — auto-filled from selected client record in DB
- `{{invoice.*}}` — filled from invoice form fields (number, dates, totals)
- `{{#lines}} ... {{/lines}}` — filled from line items table

All placeholder values are populated server-side when generating the DOCX/PDF — the user never types placeholder strings.
