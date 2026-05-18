---
status: pass
qa_agent: parent (direct run)
generated_at: 2026-05-18T09:30:00Z
---

## Suite results

| Suite | Tests | Passed | Skipped | Failed |
|---|---|---|---|---|
| Vitest (unit) | 1004 | 1004 | 0 | 0 |
| Playwright E2E (run 1) | 340 | 322 | 17 | 1 (flake) |
| Playwright E2E (run 2) | 340 | 323 | 17 | 0 |

The one failure on run 1 (`ac1-ac3-layout.spec.ts:14` — sidebar nav items) was a timing flake
in the full-suite run; it passed on run 2 and passes consistently in isolation. Not related to
this feature.

## AC coverage

| AC | Spec | Result |
|---|---|---|
| AC-1 GET /api/v1/settings/company | `companyProfileApi.test.ts`, `useCompanyProfile.test.ts`, `company-profile.spec.ts` | pass |
| AC-2 PUT persists + renders new values | `companyProfileApi.test.ts`, `CompanyProfileSettingsPage.test.tsx`, `company-profile.spec.ts` | pass |
| AC-3 All 8 fields persisted | `companyProfileSchema.test.ts`, `CompanyProfileForm.test.tsx` | pass |
| AC-4 CompanyProfileResolver injected | `InvoiceRenderServiceTest.java`, `CompanyProfileResolverTest.java` | pass |
| AC-5 DOCX contains resolved company | `CompanyProfileFlowIT.java` | pass |
| AC-6 SPA form + validation + toast | `CompanyProfileSettingsPage.test.tsx`, `CompanyProfileForm.test.tsx`, `company-profile.spec.ts` | pass |
| AC-7 Sidebar Company Profile link | `Sidebar.test.tsx`, `company-profile.spec.ts` | pass |
| AC-9 Legacy PDF/docx unchanged | `InvoiceRenderServiceTest.java` | pass |
| AC-10 Coverage gates | Vitest 99.21/93.26/96.91/99.21 ≥ thresholds; JaCoCo ≥ 0.90 | pass |
