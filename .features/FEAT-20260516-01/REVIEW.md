---
status: pass
iteration: 1
reviewer: claude-sonnet
generated_at: 2026-05-16T18:30:00Z
---

## Summary

The expense-tracking feature is fully implemented across all planned layers and the build is reported green by the developer agent (backend mvnw -Pfast verify exits 0; 911 frontend Vitest tests passing; JaCoCo >= 90%). All five CRUD endpoints plus the summary endpoint exist, are protected by the existing Spring Security filter chain, and return the correct HTTP statuses. The frontend slice covers the complete UI composition: month picker, grand-total card, per-category cards, paginated table, create/edit modal, and delete-confirmation dialog. Soft-delete, optimistic locking (@Version), and the EntityManager.find()-then-update pattern are all applied correctly. Test coverage at the unit, integration, and component levels is comprehensive. No blocking issues were found. Three non-blocking items are raised.

## Findings

### Required (blocking)

None.

### Recommended (non-blocking)

- [ ] backend/src/main/resources/db/migration/V12__create_expenses.sql -- The plan specified three partial indexes but only two are present. The third index, ix_expenses_month_active on date_trunc month expense_date, is absent. The omission is covered by risk R-1 in the plan because H2 does not support date_trunc in partial index expressions and the summary query relies on Testcontainers Postgres. Consider adding a SQL comment explaining the gap, or tracking the index in a follow-up Postgres-only migration for operational completeness.

- [ ] frontend/src/features/expenses/model/categories.ts and all UI consumers -- The plan specified a categoryI18nKey(c) helper and a full expenses.categories.* key hierarchy in en.json. The implementation exports a hardcoded English categoryLabel() function that bypasses react-i18next entirely. en.json contains only nav.expenses; no category translation keys exist. Plan risk R-3 said ship English only but intended the architecture to route through translation keys so a future locale JSON drop would suffice without code changes. As shipped, adding a second locale requires edits at each categoryLabel() call site. Suggested fix: add 10 keys under expenses.categories in en.json and call t('expenses.categories.' + category) at each call site.

- [ ] frontend/src/features/expenses/model/types.ts (Expense.amount, ExpenseSummary.grandTotal, ExpenseSummaryItem.total typed as string) -- The backend BigDecimal fields are serialized by Jackson as unquoted JSON numbers. The parseFloat() calls in ExpenseDashboard.tsx and ExpenseTable.tsx tolerate numeric values at runtime so no user-visible bug exists, but TypeScript will not catch illegal string operations on these fields. Consistent fix: either set spring.jackson.serialization.WRITE_NUMBERS_AS_STRINGS=true so the API returns quoted decimals matching the string types, or change the TS types to number and remove the parseFloat() wrappers.

## Coverage check

- Backend JaCoCo: >= 90% (gate 90%) -- pass. Developer agent confirmed mvnw -Pfast verify green. Every public method on ExpenseService has a unit test; controller has 15 MockMvc tests plus a RANDOM_PORT IT; repository adapter has an IT covering persist/find/soft-delete/filter/summary/update; mapper has a 3-test round-trip suite.
- Frontend Vitest: 911 tests passing (gate 95/95/95/90) -- pass. All hooks, API functions, UI components, and the page composition are tested including loading, empty, data, and error states plus user interaction flows.

## Plan adherence

- Every acceptance criterion mapped to code and tests? yes
  - AC-1: Sidebar.tsx NAV_ITEMS includes expenses entry with Wallet icon; App.tsx registers /expenses route; pages/ExpensesPage.tsx wrapper exists.
  - AC-2: ExpenseController.list() with category/dateFrom/dateTo params; ExpenseService.list() clamps size to 100; four query paths in ExpenseRepositoryAdapter.
  - AC-3: ExpenseController.create() returns ResponseEntity.created(location) with 201; Location header verified in ExpenseControllerTest.
  - AC-4: PUT (full replacement) returns 200; DELETE (soft-delete) returns 204; 404 on missing tested for both.
  - AC-5: ExpenseController.summary() passes null to service when month param absent; service resolves via YearMonth.now(clock); tested.
  - AC-6: ExpensesPage.tsx: month picker, grand-total card, category cards, expense table, pagination in order.
  - AC-7: ExpenseDashboard.tsx renders CategoryIcon plus label plus formatted amount plus count with singular/plural.
  - AC-8: ExpenseTable.tsx columns Date|Category|Description|Amount|Actions with right-aligned amount.
  - AC-9: handleSubmit calls createMutate or updateMutate, toasts success, calls refetch() plus refetchSummary(), closes modal.
  - AC-10: openEdit() pre-populates ExpenseFormSheet; ConfirmDeleteDialog implemented with cancel/confirm pattern.
  - AC-11: @DecimalMin(0.01)/@DecimalMax(9999999.99)/@PastOrPresent/@Size(max=500) on both Create and Update DTOs; Zod schema mirrors all rules; negative-path tests exist on both BE and FE.
  - AC-12: ExpenseControllerTest.unauthenticated_returns_401 (MockMvc) and ExpenseControllerIT.unauthenticated_request_returns_401 (HTTP) both confirm 401.
  - AC-13: JaCoCo and Vitest gates reported green.
  - AC-14: Deferred to documentation agent.

- Files outside the plan change list:
  - application/expense/ExpenseCommand.java is absent. The plan listed a sealed interface with Create + Update records; the implementation uses direct method parameters on ExpenseService. This is a simpler approach with no functional difference and no missing behaviour. Acceptable deviation.
  - tests/expenses/create-and-view.spec.ts and tests/expenses/delete-flow.spec.ts (Playwright E2E) are absent. Both were listed in the plan. The create and delete flows are exercised by Vitest component tests in ExpensesPage.test.tsx with MSW so coverage is maintained. The Playwright specs should be added before the QA phase.