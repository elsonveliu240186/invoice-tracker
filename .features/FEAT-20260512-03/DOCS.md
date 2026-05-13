---
feature_id: FEAT-20260512-03
title: Dashboard and core UI modernization
status: pass
generated_at: 2026-05-13T15:00:00Z
generated_by: claude-sonnet-4-6
---

# Documentation summary — FEAT-20260512-03

This artefact records every documentation file changed by the documentation agent for this feature. It is the source linked from the PR description.

## Changed files

| File | Change type | Summary |
|------|-------------|---------|
| `docs/CHANGELOG.md` | prepend | Added [Unreleased] entry for FEAT-20260512-03 describing all UI changes, new deps, coverage gate results, and E2E results. |
| `docs/FEATURES.md` | add row + add section | Added FEAT-20260512-03 row to the feature table; added full detail section including component breakdown, quality gate results, and tracked v1 limitations (R-4 through R-7). |
| `docs/ARCHITECTURE.md` | update diagram + add ADRs | Replaced the Frontend Components C4-level-3 flowchart to include AppShell, Sidebar, MobileSidebar, TopNav, UserMenu, DashboardPage, ClientDetailPage, ClientFormSheet, ConfirmDeleteDialog, ClientStatusBadge, derive.ts, PageTransition, and EmptyState. Added ADR-012 (client status derived client-side) and ADR-013 (layout components in src/shared/components/ not src/shared/layout/). |
| `docs/SEQUENCE_DIAGRAMS.md` | append section | Added `### FEAT-20260512-03` section with two mermaid diagrams from PLAN.md: Edit a client (happy path) and Delete confirmation cancel (edge case). |
| `docs/API.md` | add section | Added "Frontend routes (SPA)" table documenting the new `/`, `/clients`, and `/clients/:id` routes and which components they map to, keeping the existing backend endpoint documentation intact. |
| `docs/SECURITY.md` | add findings + history row | Added three open findings (OF-1 nginx security headers, OF-2 vite/esbuild upgrades, OF-3 localStorage token); prepended a history row for FEAT-20260512-03 with OWASP audit summary and non-blocking recommendations. |
| `postman/collection.json` | add request | Added "Dashboard KPI — Count Clients (size=1)" request to the Clients folder representing the `GET /api/v1/clients?size=1` call the DashboardPage makes; includes pm.test assertions and sets `kpiTotalClients` environment variable. All existing requests and pm.test scripts preserved unchanged. |
| `postman/local-dev.environment.json` | add variable | Added `kpiTotalClients` variable (set by the new KPI request test script). Existing variables unchanged; no user-supplied secrets overwritten. |
| `.features/FEAT-20260512-03/DOCS.md` | create | This file. |

## Backend changes

None. This feature is frontend-only. `docs/openapi.json` is unchanged; the backend API surface (8 endpoints across Auth, Health, and Clients tags) is identical to the state left by FEAT-20260512-02. No backend regeneration was performed.

## Frontend route changes

| Old path / component | New path / component | Notes |
|---------------------|---------------------|-------|
| `/` → `HomePage` (stub) | `/` → `DashboardPage` | `HomePage.tsx` re-exports `DashboardPage`. |
| `/clients` → `ClientsPage` (scaffold layout) | `/clients` → `ClientsPage` (shadcn Table + Sheet + AlertDialog) | Same path; new implementation. |
| (none) | `/clients/:id` → `ClientDetailPage` | New route added. |

## i18n keys added

New keys added to `frontend/src/shared/i18n/locales/en.json` under the following namespaces (exhaustive list in PLAN.md §6):

- `nav.*` (7 keys): sidebar navigation labels and ARIA strings
- `topnav.*` (3 keys): UserMenu dropdown items
- `dashboard.*` (7 keys): KPI card labels and activity section
- `clients.*` (26 keys): table columns, actions, form fields, filters, toasts, empty state
- `clientDetail.*` (5 keys): detail page field labels and messages
- `common.*` (8 keys): shared button labels and pagination strings

## Known documentation gaps

- `docs/openapi.json` — not regenerated because no backend changes occurred. The existing file from FEAT-20260512-02 remains valid.
- Breadcrumbs sequence (reviewer non-blocking: `Breadcrumbs.tsx` not created) — no sequence diagram added for this missing component.
- `AnimatePresence` route-outlet wiring (reviewer non-blocking) — noted in FEATURES.md R-4 but not separately documented in sequence diagrams (animation timing is not meaningfully representable in a sequence diagram).
