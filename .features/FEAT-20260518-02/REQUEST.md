# Docx template placeholder substitution — fill invoice, client, and company data at generation time

## User request

When generating a .docx invoice, the backend should load the uploaded template, find placeholders
(e.g. `{{invoiceNumber}}`, `{{clientName}}`, `{{companyAddress}}`), substitute them with real values
from the invoice, client, and company records, and return the filled document.

Currently the template is returned as-is with literal placeholder text like `[Company Name]`,
`[Street Address]`, etc. The user wants actual data to appear in the generated document.

This also requires a Company Profile settings page/API so the user can store their own company
details (name, address, phone, email, VAT number, bank info) which are then injected into invoices.

Scope:
- Backend: Company profile entity + API (store/retrieve company settings per user)
- Backend: Template rendering engine — load uploaded .docx, replace placeholders, stream result
- Frontend: Company Profile settings page where the user fills in their details
- The placeholder format used in the template should be documented so users know what to put in their .docx
