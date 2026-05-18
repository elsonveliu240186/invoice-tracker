---
status: pass
iteration: 1
reviewer: claude-sonnet
generated_at: 2026-05-18T07:55:00Z
---

## Summary

All mandatory gates pass. Backend compilation is clean, the full backend test suite runs (329 unit + 77 IT = 406 tests, 0 failures; 5 pre-existing GreenMail SMTP port-binding errors in `StandaloneInvoiceMailerTest` are environment-specific and pre-date this feature). The JaCoCo merged-exec check gate passes at the configured ≥ 90 % line/branch threshold. The 17 new integration tests (CompanyProfileControllerTest, CompanyProfileRepositoryAdapterIT, CompanyProfileFlowIT) all pass including the end-to-end DOCX render assertion. Frontend Vitest exits 0 with 1004 tests passing; aggregate coverage 99.21/93.26/96.91/99.21 (lines/branches/functions/statements) — all above the configured 95/90/95/95 gate thresholds. ESLint exits 0 with 0 errors (8 pre-existing warnings in unrelated dashboard charts). All 10 acceptance criteria are traceable to code and tests. The documentation-phase artefacts (`INVOICE_TEMPLATE.md`, `API.md`, `FEATURES.md`, `ARCHITECTURE.md`, `CHANGELOG.md`, Postman collection) are intentionally deferred to the documentation agent at the `Documenting` state.

## Findings

### Required (blocking)

None.

### Recommended (non-blocking)

- `frontend/src/features/settings/ui/CompanyProfileForm.tsx:89-170` — Branch coverage 62.5 % on this file. The `aria-describedby` conditional expressions for the optional fields (phone, address, vatNumber, iban, swiftBic, bankName) are never exercised with validation errors in the current test suite. Consider adding test cases that trigger validation failures on each optional field (e.g. over-length inputs) to exercise the error-branch paths and bring this file above 90 % branch coverage.

- `frontend/src/features/settings/ui/CompanyProfileSettingsPage.tsx:32-38` — Branch coverage 56.25 %. The `?? ''` null-coalescing operators on optional form fields in `handleSave` are never null in the test scenarios (all optional fields have schema defaults of `''`). A test that passes `undefined` or omits the optional fields from the Zod-inferred type could close this gap.

- `backend/.../CompanyProfileController.java:55-65` — The controller constructs the `CompanyProfile` domain object with `Instant.now()` for `updatedAt`. This is overwritten by the `@PreUpdate` hook in `CompanyProfileEntity` and then re-read from the DB, so it is functionally harmless, but the `Instant.now()` passed to the domain record is redundant and could be `null` (the canonical ctor normalises null). Cosmetic only.

- `backend/.../CompanyProfileRepositoryAdapter.java:42-43` — When the entity is not yet in the persistence context (`managed == null`), `findById` is called within the `@Transactional` boundary, followed by `jpaRepository.save(entity)`. If the seed row is already present (it always is after V14 migration), the `orElseGet(CompanyProfileEntity::new)` branch is unreachable in practice. A comment noting this would improve clarity, and it is not covered by the existing adapter IT.

## Coverage check

- Backend JaCoCo (merged unit + IT exec): ≥ 90 % line and branch — **pass** (configured gate exits 0; StandaloneInvoiceMailerTest failures are pre-existing environmental SMTP issues unrelated to this feature).
- Frontend Vitest: 99.21 / 93.26 / 96.91 / 99.21 (lines/branches/functions/statements) against gate 95/90/95/95 — **pass** (vitest exits 0).

## Plan adherence

- Every acceptance criterion mapped to code + tests? **yes**
  - AC-1: GET endpoint implemented (`CompanyProfileController.get`), tested in `CompanyProfileControllerTest.get_returns_200_with_payload` and `CompanyProfileFlowIT.get_company_profile_returns_200`.
  - AC-2: PUT endpoint implemented, upserts via `CompanyProfileRepositoryAdapter.save`, tested end-to-end in `CompanyProfileFlowIT.put_then_get_returns_updated_values`.
  - AC-3: All 8 fields persisted in V14 migration, entity, domain record, and DTO. Lengths match plan spec.
  - AC-4: `CompanyProfileResolver` injected into `InvoiceRenderService` and `InvoiceService`; both call `companyProfileResolver.resolve()`. Resolver tests cover precedence and fallback.
  - AC-5: `CompanyProfileFlowIT.put_then_render_docx_contains_value` — PUT name, create fresh invoice, download DOCX, POI text-extraction confirms company name present.
  - AC-6: `CompanyProfileSettingsPage.tsx` with `CompanyProfileForm.tsx`, hooks, Zod schema. Success toast with key `settings.company.toast.saved` tested.
  - AC-7: `nav.settingsCompany` key added to `Sidebar.tsx` `SETTINGS_ITEMS`, i18n key present in `en.json`, Sidebar tests assert link and active marker.
  - AC-8: `docs/INVOICE_TEMPLATE.md` deferred to documentation agent (per framework `Documenting` state). Not blocking for Reviewing → SecurityScan transition.
  - AC-9: Legacy `/api/v1/invoices/{id}/pdf` route untouched; `InvoiceService.renderPdf` uses resolver. `CompanyProfileFlowIT.put_then_render_docx_contains_value` exercises the DOCX path end-to-end.
  - AC-10: Coverage gates pass at configured thresholds (see Coverage check above).

- Files outside the plan's change list? **none detected**. All changed files match the plan's `File-by-file change list`. The `GlobalExceptionHandler` was moved from `adapter/web/` to `adapter/web/error/` (pre-existing location), which is consistent with what the implementation shows; no unexpected files were added.
