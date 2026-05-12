---
feature_id: FEAT-20260512-01
title: Frontend design system foundation
generated_at: 2026-05-12T20:30:00Z
generated_by: documentation-agent (claude-sonnet-4-6)
---

# Documentation summary — FEAT-20260512-01

This feature is frontend-only. The backend API is unchanged. The documents below were
updated or created by the documentation agent on 2026-05-12.

## Changed documents

| File | Change |
|------|--------|
| `docs/CHANGELOG.md` | Prepended FEAT-20260512-01 entry under `[Unreleased]` describing the design system, all new components, theming, i18n, motion library, 179 Vitest tests, and 44 Playwright E2E specs. No breaking changes. |
| `docs/FEATURES.md` | Added row for FEAT-20260512-01 (Shipping) with links to all four artefact files. |
| `docs/ARCHITECTURE.md` | Replaced the flat frontend flowchart with the full C4-level-3 diagram from PLAN.md showing Browser/SharedUI/SharedLib/SharedTheme subgraphs. Added ADR-006 (shadcn vendoring), ADR-007 (Zustand theme store), ADR-008 (dual toast system during transition). |
| `docs/SEQUENCE_DIAGRAMS.md` | Appended new section `### FEAT-20260512-01 — Frontend design system foundation` containing both mermaid diagrams from PLAN.md: the happy-path theme toggle / i18n hydration flow and the edge-case OS colour-scheme change flow. |
| `docs/SECURITY.md` | Prepended row for FEAT-20260512-01 in the History table: 0 required fixes, 2 Moderate dev-only CVEs (carried from FEAT-20260511-01), 4 non-blocking recommendations. |

## Unchanged documents (reason)

| File | Reason |
|------|--------|
| `docs/API.md` | No backend or API changes. All existing client endpoints at `/api/v1/clients` are unmodified. |
| `postman/collection.json` | No new or modified API endpoints; the existing Postman requests remain accurate. |
| `postman/local-dev.environment.json` | No new environment variables introduced. `baseUrl`, `apiVersion`, `authToken` remain in sync. |

## Key facts for the PR description

- 179 Vitest unit tests pass; coverage 99.23 % stmts / 93.47 % branches / 98.78 % funcs /
  99.23 % lines (gates 95/95/95/90: all pass).
- 44 Playwright E2E specs pass across five design-system suites (theme, layout, i18n,
  accessibility, smoke-regression) plus the updated base smoke suite.
- Reviewer iteration 2 verdict: pass (all 13 ACs met; 4 non-blocking recommendations noted).
- Security auditor verdict: pass (0 high/critical findings; 2 dev-only moderate CVEs; 4
  non-blocking recommendations).
- No backend changes; no breaking API changes; no database migrations.
- localStorage keys introduced: `it.theme` (Zustand persist, theme preference),
  `it.lang` (i18next language cache).
- Follow-up work tracked: `components.json` file, `ClientTable.tsx` empty state component
  consistency, AppShell focus trap hardening, i18n string coverage for `ClientForm.tsx` and
  `ConfirmDeleteDialog.tsx`, full `useToast` -> sonner migration (FEAT-20260512-03),
  vite `>=6.4.2` upgrade.
