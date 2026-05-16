---
status: pass
iteration: 2
reviewer: claude-sonnet
generated_at: 2026-05-14T21:50:00Z
---

## Summary

All three build gates pass cleanly for iteration 2. `pnpm lint` exits 0 (0 errors, 3 pre-existing fast-refresh warnings in unrelated dashboard chart files). `./mvnw -B -Pfast verify` exits BUILD SUCCESS with all 278 unit + IT tests green, Checkstyle 0 violations, SpotBugs 0 bugs, and "All coverage checks have been met" from JaCoCo. Vitest passes 661 tests across 87 files with statements 98.35% / branches 92.22% / functions 95.76% — all above the configured gates. The five blocking ESLint errors from iteration 1 are confirmed fixed: `generatedArtifactApi.test.ts` now uses `vi.spyOn(anchor, 'click')` eliminating the `unbound-method` violation; `GenerateInvoiceButton.test.tsx` uses a top-level `import { toast } from 'sonner'` eliminating `no-require-imports`. All three Playwright E2E specs are present (`tests/invoices/preview-and-generate.spec.ts`, `tests/invoices/send-with-saved.spec.ts`, `tests/settings/template-manager.spec.ts`). The Sidebar now has `{ to: '/invoices/template', labelKey: 'nav.invoiceTemplate' }` as a child item. `SendInvoiceButton.tsx` renders `t('invoices.confirm.send.subtitle')`. The duplicate `toast` key in `en.json` has been resolved — the three `toast` objects now live in distinct namespaces (`clients.toast`, `invoices.toast`, `settings.invoiceTemplate.toast`). AC-8 is fully implemented: `InvoiceService.deleteInvoice()` calls `artifactService.deleteAll(id)` then `invoiceRepository.softDelete(id)`, and `DELETE /api/v1/invoices/{id}` is wired in the controller. Two recommended items from iteration 1 remain not fully addressed (see below) but are non-blocking.

## Findings

### Required (blocking)

None.

### Recommended (non-blocking)

- [ ] `backend/src/test/java/com/example/invoicetracker/application/invoice/InvoiceRenderServiceTest.java` — The plan's test strategy (row 15) required explicit tests `sendEmail_uses_saved_pdf_when_present` (verify `artifactService.findPdfBytes` called; `pdfRenderer.render` NOT called) and `sendEmail_falls_back_to_live_render_when_no_saved` (verify `pdfRenderer.render` called when `findPdfBytes` returns empty) in `InvoiceRenderServiceTest`. These tests exist in `InvoiceServiceTest` but not in `InvoiceRenderServiceTest`. The production path in `InvoiceRenderService.sendEmail` does use `artifactService.findPdfBytes`, but the existing tests only exercise the fallback implicitly (Mockito returns empty Optional by default). The happy path through the saved-artifact branch in `InvoiceRenderService` is untested.
- [ ] `frontend/src/features/invoices/ui/SendInvoiceButton.test.tsx` — No test assertion verifies that the subtitle (`invoices.confirm.send.subtitle` = "Will use saved PDF if generated, otherwise renders live.") is rendered in the confirm dialog. The component renders it correctly, but the test suite has no `getByText` or role-based assertion for this string.

## Coverage check

- Backend JaCoCo (merged unit + IT): gate set at 95% lines + branches — pass ("All coverage checks have been met").
- Frontend Vitest: statements 98.35%, branches 92.22%, functions 95.76%, lines 98.35% — pass (gate: stmts/lines/funcs ≥ 95%, branches ≥ 90%).

## Plan adherence

- Every acceptance criterion mapped to code + tests? **Yes** (with minor gaps noted as recommended above).
  - AC-1 (template manager route `/invoices/template`): yes — `InvoiceTemplateManagerPage`, route in `App.tsx`, toolbar link in `InvoicesListPage`, sidebar child nav item present.
  - AC-2 (preview modal): yes — `PreviewInvoiceButton` with blob iframe, open/close, Esc/backdrop, "Open in new tab" + download actions.
  - AC-3 (Generate & Save): yes — `GenerateInvoiceButton`, `POST /{id}/generate`, `GeneratedArtifactBadge`.
  - AC-4 (`GET /generated` + `/generated/metadata`): yes — controller, service, adapter.
  - AC-5 (DownloadInvoiceMenu saved-vs-live + Regenerate): yes — implemented and tested.
  - AC-6 (Send email uses saved bytes): yes — `InvoiceService.sendEmail` and `InvoiceRenderService.sendEmail` both call `artifactService.findPdfBytes`; subtitle rendered in confirm dialog.
  - AC-7 (filesystem store, max-size, path traversal, quota): yes — `FilesystemGeneratedArtifactStore`, `GeneratedArtifactProperties`, V8 migration.
  - AC-8 (soft-delete propagates to artefacts): yes — `InvoiceService.deleteInvoice` calls `artifactService.deleteAll(id)` then soft-deletes; `DELETE /api/v1/invoices/{id}` → 204 wired.
  - AC-9 (auth, problem+json, Cache-Control, INFO logs): yes.
  - AC-10 (i18n keys — no duplicate toast block): yes — duplicate resolved; all keys present under correct namespaces.
  - AC-11 (coverage gates remain ≥ 95%): yes — gates pass.
  - AC-12 (openapi.json + postman + docs): deferred to documentation agent per plan; springdoc `@Operation` annotations present.

- Files outside the plan's change list? No — all changed files are covered by the plan's change list. Build artefacts (`tsconfig.tsbuildinfo`) excluded.
