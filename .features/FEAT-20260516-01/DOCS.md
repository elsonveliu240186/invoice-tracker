---
feature_id: FEAT-20260516-01
title: Expense tracking with category dashboard + auth rate-limiting
generated_at: 2026-05-17T00:00:00Z
generated_by: documentation-agent
---

# DOCS — FEAT-20260516-01

## Summary

Documentation pass for the expense-tracking feature. The live backend was started (`./mvnw -Pfast spring-boot:run`), the OpenAPI spec was fetched from `http://localhost:8080/v3/api-docs` (25 paths, including the new `Expenses` tag), enriched with proper `info`, `securitySchemes`, `security`, and rate-limit annotations, and written to `docs/openapi.json`. All six docs files were refreshed; all pre-existing Git conflict markers (from three prior unresolved branch merges) were resolved.

## Files changed

| File | Change type | Description |
|------|-------------|-------------|
| `projects/invoice-tracker/docs/openapi.json` | Regenerated from live backend | Fetched from `GET /v3/api-docs` (25 paths). Enriched: `info.title/version/description`, `servers`, `security: [{basicAuth:[]}]`, `components.securitySchemes.basicAuth`, rate-limit `description` on `/auth/login` and `/auth/register`, `429` response on both auth endpoints. Replaces hand-constructed previous version. |
| `projects/invoice-tracker/docs/CHANGELOG.md` | Prepended + conflict markers resolved | New `[Unreleased]` entry for FEAT-20260516-01 (expense CRUD + auth rate-limiting + invoice update endpoint). Removed `<<<<<<< HEAD` / `=======` / `>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui` markers that were unresolved since the FEAT-20260513-01 merge. |
| `projects/invoice-tracker/docs/FEATURES.md` | Row added + section added + conflict markers resolved | New row for FEAT-20260516-01 (state: Shipping). New `## FEAT-20260516-01` detail section with overview, new-endpoints table, backend/frontend changes summary, quality-gate results, security findings resolved, and known open items. Removed all unresolved conflict markers from prior branch merges (FEAT-20260514-02 and FEAT-20260512-03). |
| `projects/invoice-tracker/docs/ARCHITECTURE.md` | Updated + conflict markers resolved | `## Components — Backend`: added `ExpenseController`, `ExpenseService`, `ExpenseRepositoryAdapter`, `AuthRateLimitFilter` to the backend flowchart; added `Expense`/`ExpenseCategory`/`CategorySummary` to domain entities; added `expenses` table (V12) to the Postgres DB node. `## Components — Frontend`: replaced all conflict-marker blocks with clean merged content; added `ExpensesFeature` subgraph (ExpensesPage, ExpenseDashboard, ExpenseTable, ExpenseFormSheet, CategoryBadge/CategoryIcon, hooks); added `/expenses` route edge. ADRs: added ADR-026 (Bucket4j in-memory bucket store) and ADR-027 (expense `category` stored as VARCHAR(50)+CHECK). Resolved all `<<<<<<< HEAD` markers from FEAT-20260514-02 and FEAT-20260512-03 merges. |
| `projects/invoice-tracker/docs/SEQUENCE_DIAGRAMS.md` | Appended + conflict markers resolved | New `### FEAT-20260516-01` section with three mermaid diagrams: (4a) create expense → dashboard refresh happy path, (4b) change month with no expenses, (4c) auth rate-limit brute-force protection. Resolved all unresolved conflict markers. |
| `projects/invoice-tracker/docs/API.md` | Extended | Auth section: added rate-limit note to `/auth/login` and `/auth/register` descriptions; added `429 RATE_LIMIT_EXCEEDED` to their error tables. Endpoints table: added six Expenses rows. New `## Expenses (FEAT-20260516-01)` section with full endpoint documentation (GET list, POST create, GET/{id}, PUT/{id}, DELETE/{id}, GET /summary) including request/response schemas and error tables. Error codes table: added `EXPENSE_NOT_FOUND` (404) and `RATE_LIMIT_EXCEEDED` (429). |
| `projects/invoice-tracker/docs/SECURITY.md` | Row prepended + conflict markers resolved | New history row for FEAT-20260516-01 describing all 4 security-auditor iterations, tools run, findings, and resolutions. Resolved `<<<<<<< HEAD` / `>>>>>>>` markers in History table. |
| `projects/invoice-tracker/postman/collection.json` | Expenses folder added | New `Expenses` folder with 6 requests: List Expenses (GET with optional query params), Create Expense (POST with example body, sets `expenseId` env var), Get Expense (GET by `{{expenseId}}`), Update Expense (PUT with example body), Get Expense Summary (GET /summary?month=2026-05), Delete Expense (DELETE). All requests use Basic auth via `{{username}}`/`{{password}}`. Each request has `pm.test` assertions. |
| `projects/invoice-tracker/postman/local-dev.environment.json` | Variable added | Added `expenseId` environment variable (empty string default) to sync with the new Create Expense `pm.environment.set('expenseId', ...)` call. |

## OpenAPI spec notes

- Source: live backend `GET http://localhost:8080/v3/api-docs` with backend started via `./mvnw -Pfast spring-boot:run`.
- 25 paths total; tags: `Invoices`, `Clients`, `Dashboard`, `Auth`, `Expenses`, `Settings`, `Invoice Rendering`.
- The springdoc-generated spec had minimal `info` (`title: "OpenAPI definition"`, `version: "v0"`). The documentation agent enriched this to the correct project title/version/description and added `securitySchemes`.
- Rate-limiting is implemented at the filter layer (`AuthRateLimitFilter`) and is not reflected in springdoc annotations automatically; it was added manually to the `description` and `responses.429` of the `/auth/login` and `/auth/register` operations.
- The `/api/v1/ping` health endpoint is present in the spec (returned by springdoc) and left as-is.

## Conflict markers resolved

The following files had unresolved Git conflict markers from prior branch merges that were resolved as part of this documentation pass (the correct HEAD content — which included the more recent features — was retained in all cases):

- `docs/ARCHITECTURE.md` — 10 conflict regions from `feat/FEAT-20260514-02-invoice-lifecycle` and `feat/FEAT-20260512-03-dashboard-core-ui`
- `docs/FEATURES.md` — 4 conflict regions from the same branches
- `docs/CHANGELOG.md` — 2 conflict regions
- `docs/SEQUENCE_DIAGRAMS.md` — 3 conflict regions
- `docs/SECURITY.md` — 1 conflict region
