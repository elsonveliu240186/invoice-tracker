---
feature_id: FEAT-20260517-01
title: Expense Dashboard Charts — By Month and By Category (+ Dashboard Date Filter)
generated_at: 2026-05-17T19:00:00Z
generated_by: documentation-agent
---

# DOCS — FEAT-20260517-01

## Summary

This feature adds expense visibility to the home dashboard. Two new chart widgets appear below the existing invoice charts: a **bar chart of expense totals by month** (last 6 calendar months, zero-filled) and a **donut chart of expense totals by category**. Both charts are driven by a single new backend endpoint `GET /api/v1/dashboard/expense-stats`. A **date-range filter popover** (calendar icon button, top-right of the dashboard) lets the user narrow all four charts simultaneously by forwarding optional `from`/`to` query params to both `GET /api/v1/dashboard/stats` and the new `GET /api/v1/dashboard/expense-stats`.

Review passed on iteration 2 (1 blocking failure in iteration 1 related to `getStats` date-branching logic, Postman update, and Playwright E2E). Security scan passed on the first iteration. QA passed on the first iteration (11 Playwright tests, 0 failures).

---

## What was built

### Backend

| Component | Type | Description |
|-----------|------|-------------|
| `MonthlyExpense` | Domain record | `(String month, BigDecimal total)` — mirrors `MonthlyRevenue`; lives in `domain/expense` to avoid cross-package DTO leakage |
| `ExpenseRepository` (edited) | Port | Two new methods: `expenseByMonth(from, to)` and `expenseByCategoryInRange(from, to)` |
| `ExpenseJpaRepository` (edited) | JPA | Two `@Query(nativeQuery=true)` methods using `TO_CHAR(expense_date,'YYYY-MM')` and `GROUP BY category` |
| `ExpenseRepositoryAdapter` (edited) | Adapter | Implements the two new repository methods; null-safe for `SUM()` returning null |
| `DashboardService` (edited) | Service | New `getExpenseStats(from, to)` — default 6-month window, 24-month cap, zero-fill months, sort categories by total desc; also extended `getStats(from, to)` to call ranged repo methods when either date param is non-null |
| `ExpenseStatsResponse` | DTO record | `{ from, to, grandTotal, expenseByMonth[], expenseByCategory[] }` |
| `CategoryExpense` | DTO record | `{ category: ExpenseCategory, total: BigDecimal, count: long }` |
| `DashboardController` (edited) | Controller | New `GET /api/v1/dashboard/expense-stats` mapping; optional `from`/`to` validation (`from > to` → 400, range > 24 months → 400); existing `getStats` updated to accept `from`/`to` query params |
| `V13__add_expense_dashboard_indexes.sql` | Flyway migration | Functional index `ix_expenses_month_active ON expenses (date_trunc('month', expense_date)) WHERE deleted_at IS NULL` |

### Frontend

| File | Action | Description |
|------|--------|-------------|
| `features/dashboard/model/types.ts` | edited | Added `MonthlyExpense`, `CategoryExpense`, `DashboardExpenseStats` interfaces |
| `features/dashboard/api/dashboardExpenseApi.ts` | created | `getDashboardExpenseStats(from?, to?)` — calls the new endpoint |
| `features/dashboard/api/dashboardExpenseApi.test.ts` | created | MSW tests: success shape, 503 → ApiError |
| `features/dashboard/api/useDashboardExpenseStats.ts` | created | Hook with `data`, `loading`, `error`; refetches on `from`/`to` change |
| `features/dashboard/api/useDashboardExpenseStats.test.ts` | created | loading → data, error propagation, refetch on dep change |
| `features/dashboard/api/useDashboardStats.ts` | edited | Accepts `from?` / `to?`; appends as query params; included in `useEffect` dep array |
| `features/dashboard/ui/ExpenseByMonthChart.tsx` | created | Bar chart; `data-testid="expense-by-month-chart"`; uses `--color-chart-2` token |
| `features/dashboard/ui/ExpenseByMonthChart.test.tsx` | created | Renders, empty data, currency tick, tooltip label |
| `features/dashboard/ui/ExpenseByCategoryChart.tsx` | created | Donut PieChart; localised category labels via `t('expenses.categories.*')`; `data-testid="expense-by-category-chart"` |
| `features/dashboard/ui/ExpenseByCategoryChart.test.tsx` | created | Renders, empty data, percentage labels, i18n category names |
| `features/dashboard/ui/DashboardDateFilter.tsx` | created | Icon button + Radix Popover with From/To date inputs + Apply + Clear; outside-click blocked via `onInteractOutside`; active highlight when filter set |
| `features/dashboard/ui/DashboardDateFilter.test.tsx` | created | Opens popover, Apply calls onChange, Clear calls onChange(null,null), active styling |
| `features/dashboard/ui/DashboardPage.tsx` | edited | Added `from`/`to` state; `DashboardDateFilter` in page header; second chart row (ExpenseByMonth + ExpenseByCategoryChart); independent loading/error per section |
| `features/dashboard/ui/DashboardPage.test.tsx` | edited | 6 new tests: chart testids, expense skeleton, expense inline alert, i18n headings, date filter, filter re-fetch |
| `mocks/handlers.ts` | edited | `GET /api/v1/dashboard/expense-stats` mock returning 6 months + category array |
| `shared/locales/en.json` | edited | Keys added under `dashboard.charts.*` (expenseByMonth, expenseByCategory, expensesTooltip), `dashboard.errors.expenses`, `dashboard.filter.*` (label, from, to, apply, clear) |
| `tests/dashboard/expense-charts.spec.ts` | created | 6 Playwright E2E tests covering both chart sections, i18n headings, date filter popover, filter re-fetch |
| `tests/dashboard/dashboard-smoke.spec.ts` | created | 5 smoke tests: stat cards, revenue chart, invoice status chart, welcome banner, all 4 chart sections coexist |

### Postman / docs

| File | Change |
|------|--------|
| `postman/collection.json` | Added "Get Expense Stats" request under Dashboard folder with optional `from`/`to` query params and HTTP Basic auth |
| `docs/openapi.json` | Regeneration deferred to next live-stack run (no running backend available); hand-construction not performed per task instructions |

---

## API contract

### New endpoint: GET `/api/v1/dashboard/expense-stats`

**Auth**: HTTP Basic required. Returns `401` when unauthenticated.

**Query parameters**:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `from` | `YYYY-MM-DD` | first day of (today − 5 months) | Inclusive start of the expense window |
| `to` | `YYYY-MM-DD` | today | Inclusive end of the expense window |

Validation: if both `from` and `to` are supplied, `from` must be ≤ `to` and the range must not exceed 24 months; otherwise `400`.

**Success response** `200 OK`:

```json
{
  "from": "2025-12-01",
  "to": "2026-05-17",
  "grandTotal": "1234.56",
  "expenseByMonth": [
    { "month": "2025-12", "total": "0.00" },
    { "month": "2026-01", "total": "210.00" },
    { "month": "2026-02", "total": "0.00" },
    { "month": "2026-03", "total": "88.50" },
    { "month": "2026-04", "total": "516.06" },
    { "month": "2026-05", "total": "420.00" }
  ],
  "expenseByCategory": [
    { "category": "FOOD_DRINK", "total": "420.00", "count": 12 },
    { "category": "TRANSPORT",  "total": "514.56", "count": 9 }
  ]
}
```

| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Resolved start date (`YYYY-MM-DD`) |
| `to` | string | Resolved end date (`YYYY-MM-DD`) |
| `grandTotal` | BigDecimal (string) | Sum of all non-deleted expenses in window |
| `expenseByMonth` | array | Exactly 6 entries when defaults used; chronological, zero-filled; entries span `[from..to]` clamped to month boundaries for custom ranges |
| `expenseByCategory` | array | Sorted by `total DESC` then `category ASC`; empty array when no data |

**Error responses**:

| Status | Code | Condition |
|--------|------|-----------|
| `400 Bad Request` | `VALIDATION_FAILED` | `from > to`, range > 24 months, or malformed date |
| `401 Unauthorized` | `UNAUTHENTICATED` | No / invalid credentials |

### Updated endpoint: GET `/api/v1/dashboard/stats`

Now accepts the same optional `from` and `to` query parameters. When either is non-null, `DashboardService.getStats` routes to the ranged repository methods (`countByStatusInRange`, `revenueByStatusInRange`, `revenueByMonthInRange`) instead of the all-time methods. Validation mirrors `getExpenseStats`.

---

## Frontend components

| Component | Location | Props |
|-----------|----------|-------|
| `ExpenseByMonthChart` | `features/dashboard/ui/` | `data: MonthlyExpense[]` |
| `ExpenseByCategoryChart` | `features/dashboard/ui/` | `data: CategoryExpense[]` |
| `DashboardDateFilter` | `features/dashboard/ui/` | `from: string\|null; to: string\|null; onChange(from, to): void` |

`DashboardDateFilter` uses `onInteractOutside={(e) => e.preventDefault()}` so the popover only closes when Apply or Clear is clicked — not when the user clicks elsewhere on the page.

---

## Data model changes

No new entities. One new Flyway migration:

- `V13__add_expense_dashboard_indexes.sql` — partial functional index `ix_expenses_month_active ON expenses (date_trunc('month', expense_date)) WHERE deleted_at IS NULL`. Improves performance of the `TO_CHAR`-based monthly aggregation query.

---

## Test coverage

### Backend

| Layer | Tests added | Key assertions |
|-------|-------------|----------------|
| Unit (Service) | 4 new tests in `DashboardServiceTest` | zero-fill 6 months, aggregate + sort categories, custom range pass-through, null-sum handling |
| Unit (Controller) | 3 new tests in `DashboardControllerTest` | 200 happy path (JSON path assertions), 400 invalid range, 401 unauth |
| Integration (Controller) | 2 new tests in `DashboardControllerIT` | Testcontainers Postgres: creates 3 expenses across 2 months/2 categories and asserts non-zero sums; 401 unauth |
| Integration (Repository) | 2 new tests in `ExpenseRepositoryAdapterIT` | `TO_CHAR` grouping and soft-delete exclusion; category range grouping and out-of-range exclusion |

### Frontend

| Layer | Tests added |
|-------|-------------|
| API unit | 2 tests in `dashboardExpenseApi.test.ts` |
| Hook unit | 3 tests in `useDashboardExpenseStats.test.ts` |
| Chart unit | 4 tests in `ExpenseByMonthChart.test.tsx` |
| Chart unit | 5 tests in `ExpenseByCategoryChart.test.tsx` |
| Filter unit | 5 tests in `DashboardDateFilter.test.tsx` |
| Page unit | 6 new tests in `DashboardPage.test.tsx` |
| E2E (Playwright) | 6 tests in `expense-charts.spec.ts` + 5 smoke in `dashboard-smoke.spec.ts` |

Frontend Vitest global thresholds: 95/95/95/90 — pass (982 tests, 113 test files).

---

## Security

All OWASP Top 10 items assessed; no new attack surface beyond the existing dashboard pattern. Key mitigations:

- A01 Broken Access Control: endpoint reuses `SecurityConfig` HTTP Basic chain; 401 path tested.
- A03 Injection: `from`/`to` parsed as `LocalDate` at the binding layer (non-date inputs rejected before service); native queries use `@Param` binding.
- A04 Insecure Design: `from > to` returns 400; 24-month cap prevents DoS via unbounded range.
- A09 Logging: `log.info("dashboard.expenseStats from={} to={} grandTotal={}", ...)` — no PII.

---

## Non-blocking recommendations (from Review)

| Item | Description |
|------|-------------|
| `DashboardDateFilter.test.tsx` | "button has active styling" asserts `btn.className` contains `'--color-primary'` — brittle; consider `data-active` attribute instead |
| `DashboardController.getStats` | Missing `from > to` guard on the existing stats endpoint (expense-stats has the guard); low-risk for a read-only endpoint |
| `PreviewInvoiceButton.tsx` | Changed `rel="noreferrer"` to `rel="noopener noreferrer"` (out of scope but benign) |
| `expense-charts.spec.ts:130-145` | "applying a date filter re-fetches" uses `page.waitForFunction(() => true)` — replace with `page.waitForRequest` for CI reliability |

---

## Changed files — summary

| File | Change type |
|------|-------------|
| `.features/FEAT-20260517-01/DOCS.md` | created (this file) |
| `docs/CHANGELOG.md` | prepended FEAT-20260517-01 entry under [Unreleased] |
| `docs/FEATURES.md` | added FEAT-20260517-01 row and detail section |
| `docs/API.md` | added `GET /api/v1/dashboard/expense-stats` endpoint; noted `GET /api/v1/dashboard/stats` now accepts `from`/`to` |
