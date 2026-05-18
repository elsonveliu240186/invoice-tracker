---
feature_id: FEAT-20260518-02
title: Persisted Company Profile + documented docx placeholder substitution
generated_at: 2026-05-18T10:00:00Z
generated_by: documentation-agent
---

# Documentation update summary — FEAT-20260518-02

## Files changed

### docs/CHANGELOG.md

Prepended a new `[Unreleased]` entry covering:
- `GET /api/v1/settings/company` and `PUT /api/v1/settings/company` endpoints
- `company_profile` singleton table (Flyway V14)
- `CompanyProfileResolver` precedence chain (persisted → YAML → empty)
- `invoice-template.docx` updated to use poi-tl tokens
- Frontend `/settings/company` page with 8-field form and toast
- Sidebar Company Profile link
- Coverage and QA results

### docs/FEATURES.md

- Added row for FEAT-20260518-02 (status: Done) to the feature table
- Added detail section `## FEAT-20260518-02 — Persisted company profile + docx placeholder substitution` with overview, new endpoints table, backend/frontend change summary, quality gates, and security findings

### docs/ARCHITECTURE.md

- Updated "Components — Backend" heading with FEAT-20260518-02 attribution
- Added `CompanyProfileController`, `CompanyProfileService`, `CompanyProfileResolver` nodes to the mermaid flowchart
- Added `CompanyProfile` domain record and `CompanyProfileRepository` port to domain and persistence nodes
- Added `company_profile — V14` entry to the external Postgres node
- Added `CompanyProperties YAML fallback` external node wired to `CompanyProfileResolver`
- Added `render_svc --> cp_resolver` edge to show resolver injection into InvoiceRenderService
- Added new section `## Company profile + placeholder resolution (FEAT-20260518-02)` with mermaid flowchart and `company_profile` table schema
- Added `CompanyProfileResolver` precedence-chain documentation
- Added ADR-028 (singleton company profile table with PK CHECK constraint)
- Added ADR-029 (CompanyProfileResolver as a service between InvoiceRenderService and YAML)

### docs/API.md

- Added two rows to the endpoint table for `GET /api/v1/settings/company` and `PUT /api/v1/settings/company`
- Added full `## Company Profile (FEAT-20260518-02)` section with request/response schemas, field constraints, and error code table for both endpoints

### docs/INVOICE_TEMPLATE.md (NEW)

Created the placeholder catalogue documenting:
- All `{{company.*}}` nested tokens (8 fields) and their flat aliases (`{{companyName}}` etc.)
- All `{{client.*}}` tokens and aliases
- All `{{invoice.*}}` header tokens, computed fields, and aliases
- The `{{lines}}` table-loop convention with `{{description}}`, `{{quantity}}`, `{{unitPrice}}`, `{{lineTotal}}` row tokens
- Fallback / unresolved-token behaviour (`Configure.ClearHandler`)
- Instructions for downloading, editing, and re-uploading the bundled default template

### postman/collection.json

Added two new requests under the existing "Settings (FEAT-20260513-03)" folder:
- `Get Company Profile (FEAT-20260518-02)` — `GET /api/v1/settings/company` with HTTP Basic auth and `pm.test` assertions for 200 status, all 8 fields, and `updatedAt` presence
- `Update Company Profile (FEAT-20260518-02)` — `PUT /api/v1/settings/company` with example body from PLAN.md §6 and `pm.test` assertions for 200 status, name reflection, `updatedAt` timestamp pattern, and all 8 fields

### .features/FEAT-20260518-02/STATE.json

`state` updated from `Documenting` to `Shipping`.

### .features/FEAT-20260518-02/HISTORY.md

Appended timeline entry: `2026-05-18T10:00:00Z — Documenting → Shipping`.

## Files not changed

- `docs/SEQUENCE_DIAGRAMS.md` — not present in the current project docs directory (sequence diagrams are embedded in ARCHITECTURE.md and FEATURES.md sections per project convention)
- `docs/SECURITY.md` — no new OWASP findings required; security subagent passed with zero required fixes (two non-blocking recommendations noted in FEATURES.md)
- `postman/local-dev.environment.json` — no new environment variables are needed; the two new endpoints use the existing `{{baseUrl}}`, `{{apiVersion}}`, `{{username}}`, `{{password}}` variables
- `docs/openapi.json` — backend could not be started (no Docker/Postgres available in this environment); hand-construction deferred; API contract is fully documented in `docs/API.md` and `postman/collection.json`
