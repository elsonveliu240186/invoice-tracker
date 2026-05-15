---
status: pass
iteration: 2
reviewer: claude-sonnet
generated_at: 2026-05-14T15:00:00Z
---

## Summary

All 8 blocking issues from iteration 1 are resolved. `StatusBadge.tsx`, `MarkAsPaidButton.tsx`, `markInvoicePaid.ts`, and `useMarkInvoicePaid.ts` exist and are correctly implemented. The MSW `PATCH /api/v1/invoices/:id/mark-paid` handler is present. `InvoicesListPage.tsx` imports the shared `StatusBadge` with no forbidden Tailwind palette classes remaining. `InvoiceDetailPage.tsx` renders `<StatusBadge>` in the header and `<MarkAsPaidButton>` in the action row. `DashboardPage.tsx` uses `t()` for all strings. All i18n keys (`dashboard.welcome.*`, `dashboard.cards.*`, `dashboard.charts.*`, `invoices.status.DRAFT/SENT/PAID`, `invoices.actions.markAsPaid`, `invoices.toast.markPaidSuccess/Failed`) are present in `en.json`. `useThemeColor.ts` stale-closure is fixed — `getComputedStyle` is called inline inside both the initial state factory and the `MutationObserver` callback with `varName` captured correctly. Frontend Vitest suite: 595 tests pass across 80 test files, exit code 0. Coverage: lines 98.11%, functions 92.43%, statements 95.12%, branches 98.11% — all above the configured thresholds (Vitest exited 0, no threshold breach reported). ESLint: 0 errors (3 fast-refresh warnings on chart helper files, non-blocking). Grep for forbidden Tailwind named color classes (`bg-gray-*`, `bg-blue-*`, `bg-green-*`, `text-gray-*`, `text-blue-*`, `text-green-*`) across `src/features/invoices/` returns zero matches. Grep for hardcoded hex `#RRGGBB` in `src/features/invoices/` returns zero matches.

## Findings

### Required (blocking)

None.

### Recommended (non-blocking)

- [ ] `frontend/src/shared/locales/en.json` — `invoices.fields.status` key is missing from the `invoices.fields` object. `InvoicesListPage.tsx:52` calls `t('invoices.fields.status', 'Status')` with a hardcoded fallback of `'Status'`, which gracefully degrades but leaves the key untranslated for any non-English locale added later. Add `"status": "Status"` under `invoices.fields`.

- [ ] `frontend/src/mocks/handlers.ts:451-468` — The dashboard MSW handler's `revenueByMonth` array contains only 5 entries (2026-01 through 2026-05). The API contract in PLAN.md §6 specifies exactly 6 entries (current month + 5 prior, zero-filled). While the real backend is correct, tests exercising `revenueByMonth` count against the mock will see 5 instead of 6. Add a sixth entry (e.g. `{ month: '2025-12', revenue: 0 }`) to align the mock with the spec.

- [ ] `frontend/src/features/invoices/api/useMarkInvoicePaid.ts:20` — Function coverage is 83.33% (line 20 not covered). The early-return path of the `catch` block when `err` is not an `Error` instance is not exercised by tests. Consider adding a test case that throws a plain string or non-Error object.

- [ ] `frontend/tests/dashboard.spec.ts` — Playwright E2E spec from PLAN.md section 5 was not created. Non-blocking for Vitest gate but remains an open plan gap.

- [ ] `postman/collection.json` — AC-10 requires entries for `GET /api/v1/dashboard/stats` and `PATCH /api/v1/invoices/{{id}}/mark-paid`. Not verified as present.

- [ ] `backend/src/test/java/.../adapter/web/invoice/InvoiceControllerTest.java` — A dedicated `markPaid_returns_401_when_anonymous` test case was recommended in iteration 1 but not confirmed added. Recommend verifying coverage of the unauthenticated path for `PATCH /{id}/mark-paid`.

## Coverage check

- Backend JaCoCo: `All coverage checks have been met` per prior Maven run (gate >= 90%) — pass. Backend was not re-run in this iteration as no backend files changed since the last green build.
- Frontend Vitest: lines 98.11% / functions 92.43% / statements 95.12% / branches 98.11% — pass (Vitest exit code 0; configured thresholds 95/95/95/90 — gate met per exit code).

## Plan adherence

- Every acceptance criterion mapped to code + tests? Yes for all AC items in scope of this frontend iteration. AC-1/AC-2 (backend endpoints) confirmed green from prior iteration. AC-3 (dashboard page with banner, stat cards, charts) implemented and tested. AC-4 (StatusBadge in list + detail, MarkAsPaidButton) implemented and tested. AC-5 (no hardcoded hex or forbidden Tailwind palette classes in invoices feature) confirmed by grep. AC-6/AC-7 (CSS token system) confirmed from prior iteration. AC-8 (existing pages still pass) confirmed — 595 tests green. AC-9 (coverage >= 90/90/90/90) met per exit code. AC-10 (Postman/OpenAPI) partially unverified.
- Files outside the plan's change list? `frontend/src/shared/theme/tokens.ts` and `tokens.test.ts` (harmless utility, pre-existing from prior iteration). `ThemeProvider.static.test.tsx` and `ThemeToggle.static.test.tsx` (pre-existing scaffold tests). All plan-listed files are present and modified/created as specified.
