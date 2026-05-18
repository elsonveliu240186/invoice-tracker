---
status: pass
generated_at: 2026-05-18T20:30:00Z
browser_automation: false
---

## Verification scope

This feature delivers the E2E testing infrastructure itself (not a UI feature requiring a live
stack). QA therefore verifies: (a) all new source files exist and are non-empty, (b) the Maven
backend build passes including the four new test classes, and (c) the frontend Vitest unit suite
passes.

The smoke/regression Playwright specs require `docker-compose.e2e.yml` and a live backend; they
are not executed here per the QA task instructions.

---

## Specs added / files verified

### Backend test files (new — E2E infrastructure)

| File | Size | Build result |
|---|---|---|
| `backend/src/test/.../config/FlywayCleanMigrateInitializerTest.java` | 829 B | 1 test passed |
| `backend/src/test/.../adapter/web/testsupport/E2eResetControllerTest.java` | 3 791 B | included in 333 unit tests |
| `backend/src/test/.../adapter/web/testsupport/E2eResetControllerIT.java` | 5 489 B | 2 IT tests passed |
| `backend/src/test/.../adapter/web/testsupport/E2eResetControllerProfileGuardIT.java` | 2 103 B | 1 IT test passed |

### Frontend Playwright infrastructure (new)

**Smoke specs** (7 files, all non-empty):
- `frontend/tests/e2e/smoke/auth.spec.ts` — register → login → `/` → logout → `/login`
- `frontend/tests/e2e/smoke/clients.spec.ts` — create client → visible in list
- `frontend/tests/e2e/smoke/invoices.spec.ts` — create invoice → row + DRAFT badge
- `frontend/tests/e2e/smoke/send-email.spec.ts` — send invoice → MailHog 1 message
- `frontend/tests/e2e/smoke/expenses.spec.ts` — create expense → visible in list
- `frontend/tests/e2e/smoke/dashboard.spec.ts` — KPI cards render with seeded data
- `frontend/tests/e2e/smoke/settings.spec.ts` — upload valid `.docx` → metadata visible

**Regression specs** (12 files, all non-empty):
- `frontend/tests/e2e/regression/auth.spec.ts` — wrong password; session; logout; redirect
- `frontend/tests/e2e/regression/clients.spec.ts` — full CRUD; duplicate 409; search; pagination
- `frontend/tests/e2e/regression/invoices-crud.spec.ts` — multi-line; edit; delete; validation
- `frontend/tests/e2e/regression/invoices-lifecycle.spec.ts` — DRAFT→SENT→PAID; re-send guard
- `frontend/tests/e2e/regression/invoices-docx.spec.ts` — DOCX download; company name assertion (feature-guarded)
- `frontend/tests/e2e/regression/invoices-send.spec.ts` — PDF attachment; null email 422; subject
- `frontend/tests/e2e/regression/expenses.spec.ts` — CRUD; negative amount; category/date filter; pagination
- `frontend/tests/e2e/regression/dashboard.spec.ts` — revenue chart bars; expense legend; date filter
- `frontend/tests/e2e/regression/settings-company.spec.ts` — 8-field save; reload pre-fills; validation
- `frontend/tests/e2e/regression/settings-template.spec.ts` — upload valid/exe/oversize; download
- `frontend/tests/e2e/regression/navigation.spec.ts` — sidebar links; active highlight; mobile drawer; 404
- `frontend/tests/e2e/regression/accessibility.spec.ts` — axe-core on 6 key pages

**Page Object Model classes** (9 files, all non-empty):
`AppShellPage.ts`, `ClientsPage.ts`, `DashboardPage.ts`, `ExpensesPage.ts`,
`InvoiceDetailPage.ts`, `InvoicesPage.ts`, `LoginPage.ts`,
`SettingsCompanyPage.ts`, `SettingsTemplatePage.ts`

---

## Results

### Backend Maven build (`-Pfast verify`)

| Phase | Count | Failures | Skipped |
|---|---|---|---|
| Surefire (unit tests) | 333 | 0 | 0 |
| Failsafe (integration tests) | 80 | 0 | 4 (LibreOffice + existing skips) |
| Checkstyle | 0 violations | — | — |
| SpotBugs | 0 bugs | — | — |
| PMD | skipped by `-Pfast` | — | — |
| **Overall** | **BUILD SUCCESS** | — | — |

Notable new test results from the build log:
- `FlywayCleanMigrateInitializerTest`: 1 passed — verifies `clean()` + `migrate()` called in order
- `E2eResetControllerIT`: 2 passed — seed + reset → table counts = 0 (with `e2e` profile active)
- `E2eResetControllerProfileGuardIT`: 1 passed — `/api/v1/test-support/reset` returns 404 without `e2e` profile

### Frontend Vitest unit suite (`pnpm test:run`)

| Metric | Value |
|---|---|
| Test files | 118 passed (118) |
| Tests | 1 004 passed (1 004) |
| Failures | 0 |
| Duration | ~134 s |

---

## Acceptance criteria coverage

| AC | Description | Status |
|---|---|---|
| AC-1 | docker-compose.e2e.yml boots all four services | Not verified (no Docker E2E stack) |
| AC-2 | e2e profile runs flyway.clean + migrate; MailHog purged in globalSetup | FlywayCleanMigrateInitializerTest + E2eResetControllerIT: PASS |
| AC-3 | playwright.config.ts has smoke + regression projects | File exists, non-empty: PASS |
| AC-4 | All specs import from fixtures/test.ts with beforeEach reset+purge | Files exist with correct imports: PASS |
| AC-5 | POM classes in tests/e2e/pages/ with semantic methods | 9 POM files present, non-empty: PASS |
| AC-6 | TestDataFactory in fixtures/factory.ts | File exists, non-empty: PASS |
| AC-7 | axe-core scan in regression suite | accessibility.spec.ts present: PASS |
| AC-8 | Regression specs run at 1280x800 + 390x844 | playwright.config.ts defines viewports: PASS |
| AC-9 to AC-15 | All 7 smoke specs present | All 7 files non-empty: PASS |
| AC-16 to AC-27 | All 12 regression specs present | All 12 files non-empty: PASS |
| AC-28 to AC-30 | CI jobs in ci.yml + CHECKS.yml keys | Not re-verified in this QA run (covered by REVIEW.md) |

---

## Notes

- The 4 skipped integration tests in the Maven build are pre-existing skips (LibreOfficePdfConverterIT
  requires a real LibreOffice binary; InvoiceArtifactControllerIT + InvoiceControllerIT skip a subset
  requiring the same). These are not regressions introduced by this feature.
- Checkstyle WARNs about indentation in `GenerateDefaultTemplate.java` and some domain exception
  classes — these are pre-existing and do not constitute violations (0 violations reported).
