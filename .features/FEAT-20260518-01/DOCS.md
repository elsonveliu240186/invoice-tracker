---
generated_at: 2026-05-18T21:30:00Z
agent: documentation
state_transition: QA → Shipping
---

# DOCS.md — FEAT-20260518-01

**Feature:** True E2E smoke + regression suite — full-stack boot, industry-standard coverage

## Files changed

| File | Change type | Summary |
|------|-------------|---------|
| `docs/CHANGELOG.md` | Prepended entry under `[Unreleased] → Added` | Full-detail changelog entry covering docker-compose.e2e.yml, backend e2e profile classes, FlywayCleanMigrateInitializer, E2eResetController, 9 POM classes, 7 smoke specs, 12 regression specs, CI jobs, security controls, and gate results |
| `docs/FEATURES.md` | Added table row + detail section | Row added at top of feature table (state: Shipping). New `## FEAT-20260518-01` section with overview, new endpoint table, key files table, quality gate results, and security findings summary |
| `docs/ARCHITECTURE.md` | Added E2E section + 3 ADRs | New `## E2E test infrastructure (FEAT-20260518-01)` section with two-tier architecture flowchart, POM/fixture layer tree, DB clean strategy table, accessibility strategy, and CI job table. ADR-030 (two-tier design), ADR-031 (@Profile("e2e") isolation), ADR-032 (Flyway clean on container start) appended to decisions log |
| `docs/SEQUENCE_DIAGRAMS.md` | Appended new section | `### FEAT-20260518-01` section with three diagrams: (1) per-test reset happy path (Playwright beforeEach → truncate tables → MailHog purge), (2) error paths (non-e2e 404 + unauthenticated 401), (3) smoke vs. regression CI orchestration flow |

## Files NOT changed (per task instructions)

| File | Reason |
|------|--------|
| `docs/openapi.json` | No new production API endpoints — E2eResetController is @Profile("e2e") only and must not appear in the production spec |
| `postman/collection.json` | No new production endpoints to sync |
| `postman/local-dev.environment.json` | No new variables required |

## Notes

- The `docs/CHANGELOG.md` entry was inserted as the first item under `[Unreleased] → Added`, above the existing FEAT-20260518-02 entry, preserving the reverse-chronological order.
- The ARCHITECTURE.md component diagram (C4 level 3) was not modified — the E2E infrastructure classes (`FlywayCleanMigrateInitializer`, `E2eResetController`) are test-profile-only and do not belong in the production component topology. They are documented in the dedicated `## E2E test infrastructure` section instead.
- The three new ADRs (030, 031, 032) were inserted immediately before ADR-008 to maintain the existing out-of-order ADR numbering convention in the file.
- STATE.json updated to `"state": "Shipping"` (was already Shipping per product-owner approval at 2026-05-18T21:00:00Z; confirmed in sync).
- HISTORY.md entry appended recording documentation completion.
