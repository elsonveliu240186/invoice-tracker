---
feature_id: FEAT-20260513-01
title: Design System & UI Standards — dark mode fixes, responsive layout, form alignment, icon visibility
documented_at: 2026-05-14T23:55:00Z
documented_by: claude-sonnet-4-6
---

# DOCS.md — FEAT-20260513-01

Summary of every documentation file reviewed and updated during the Documenting phase.

## Files changed

| File | Action | Summary |
|------|--------|---------|
| `docs/DESIGN_SYSTEM.md` | verified / polished | Created by the developer agent. Covers all seven sections required by AC-5: token map (17 colour tokens with light/dark HSL values and Tailwind usage), shadow tokens, typed `tokens.ts` API, three new primitive APIs (Icon, FormLabel, FormField) with props tables and usage examples, dark mode guide, ESLint no-restricted-syntax rule table, breakpoint contract, and component states. No structural changes needed — content is complete and accurate. |
| `docs/ARCHITECTURE.md` | verified | Design System section already present (added during development) under "Components — Frontend": references `docs/DESIGN_SYSTEM.md` and notes FEAT-20260513-01 as the originating feature. ADR log is current through ADR-013. No changes required. |
| `docs/FEATURES.md` | updated | FEAT-20260513-01 row: corrected state from `Developing` → `Shipping`; added links to `SECURITY.md` and `QA.md` (previously `—`); updated title to match canonical feature title. Added full detail section (overview, frontend change list, quality gate results table, non-blocking recommendations table). |
| `docs/SEQUENCE_DIAGRAMS.md` | updated | Appended `### FEAT-20260513-01 — Design System & UI Standards` section with two sequence diagrams from PLAN.md: (1) dark-mode Register form happy path including password mismatch edge case; (2) search clear happy path covering Escape key and Clear button. |
| `docs/CHANGELOG.md` | verified | FEAT-20260513-01 entries already present in `[Unreleased]` under both `### Added` (design system foundation, primitives, search clear, token migration, ESLint rule, E2E suites) and `### Fixed` (dark-mode icon/text contrast, confirmPassword field). Content is accurate and complete. No changes required. |
| `docs/openapi.json` | not changed | Frontend-only feature — no backend or API changes. OpenAPI spec is unchanged. |
| `postman/collection.json` | not changed | No new endpoints. Postman collection is unchanged. |
| `postman/local-dev.environment.json` | not changed | No new path variables or auth tokens introduced. |

## Quality gate recap (for PR readers)

| Gate | Result |
|------|--------|
| Vitest stmts / funcs / lines / branches | 97.43 % / 97.80 % / 97.43 % / 91.86 % — all gates pass |
| ESLint | 0 errors |
| pnpm audit | 0 high / 0 critical |
| Playwright E2E (feature gate) | 120 / 120 passed |
| Grype JAR (CVE-2024-47554 remediated) | 0 HIGH / 0 CRITICAL |
| gitleaks | 0 secrets |
| Semgrep | 0 findings (false positive suppressed) |
| Review | Pass (iteration 2) — all 6 blocking findings resolved |

## Non-blocking follow-up items

The following items were flagged as recommended (non-blocking) in REVIEW.md and should be addressed in a follow-up feature or patch:

1. `Icon.tsx` — prepend `text-[currentColor]` as the first arg to `cn()` so the class is always present.
2. `AuthSplitLayout.tsx` — add `text-[var(--color-foreground)]` to the form panel container.
3. `input.tsx` — replace `bg-transparent` with `bg-[var(--color-background)]` to prevent browser autofill override in dark mode.
4. `index.css` — declare `color-scheme: light dark` on `:root` and `.dark`.
5. `TopNav.tsx` — rename `data-testid="hamburger"` to `data-testid="mobile-menu-trigger"` to match Playwright spec.
6. `PasswordField.tsx` — convert Eye/EyeOff direct Lucide imports to use the `<Icon>` wrapper.
7. `ClientStatusBadge.tsx` — migrate `bg-green-100 text-green-800 border-green-200` to CSS token equivalents.
