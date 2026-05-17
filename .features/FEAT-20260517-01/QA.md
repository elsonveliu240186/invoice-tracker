---
status: pass
generated_at: 2026-05-17T00:00:00Z
browser_automation: false
---

## Specs added

- `projects/invoice-tracker/frontend/tests/dashboard/expense-charts.spec.ts` — 6 tests verifying:
  - `expense-by-month-section` and `expense-by-month-chart` are rendered
  - Expense-by-month section heading is translated (not a raw i18n key, contains "expense")
  - `expense-by-category-section` and `expense-by-category-chart` are rendered
  - Expense-by-category section heading is translated (not a raw i18n key, contains "category")
  - Date filter button (`data-testid="dashboard-date-filter"`) is present and opens the popover with From/To inputs plus Apply and Clear buttons
  - Applying a date filter triggers re-fetch of both `GET /api/v1/dashboard/stats` and `GET /api/v1/dashboard/expense-stats`

- `projects/invoice-tracker/frontend/tests/dashboard/dashboard-smoke.spec.ts` — 5 smoke tests covering the most-trafficked adjacent flow (invoice charts regression guard):
  - Stat cards are rendered with data after load
  - Revenue chart section is visible with a translated heading containing "revenue"
  - Invoice status chart section is visible
  - Welcome banner shows user name
  - All four chart sections (revenue, invoice status, expense-by-month, expense-by-category) coexist on the page simultaneously

## Acceptance criteria coverage

| AC | Description | Covered by |
|----|-------------|------------|
| AC-1 | ExpenseByMonthChart bar chart appears on `/` | `expense-by-month chart section is rendered` |
| AC-2 | ExpenseByCategoryChart donut appears on `/` | `expense-by-category chart section is rendered` |
| AC-3 | Single `GET /api/v1/dashboard/expense-stats` endpoint used | Both chart specs stub and verify the endpoint |
| AC-4 | Charts render correctly with data | Spec stubs 6 months of data + 3 categories; all assertions pass |
| AC-5 | Date-range filter button opens popover with From/To/Apply/Clear | `date filter button is present and toggles the filter popover` |
| AC-6 | Active `from`/`to` range forwarded to both endpoints on Apply | `applying a date filter re-fetches both chart datasets` |
| AC-7 | Chart labels are i18n keys (not raw keys in DOM) | Heading text assertions (`not.toContain('dashboard.charts.')`) |
| AC-8 | Coverage gates (backend JaCoCo, frontend Vitest) | Not in E2E scope — verified by developer unit/IT tests |
| AC-9 | Postman + OpenAPI updated | Not in E2E scope — verified by developer/documentation agents |

## Results

- `FEAT-20260517-01: Expense Dashboard Charts` (expense-charts.spec.ts): **6 passed / 0 failed**
- `Dashboard smoke — invoice charts regression guard` (dashboard-smoke.spec.ts): **5 passed / 0 failed**
- Full dashboard suite (`tests/dashboard/`): **11 passed / 0 failed / 15 skipped** (skips are live-backend-dependent tests in co-located spec files — expected when backend is not running)

## Environment

- Frontend preview server: `pnpm build && pnpm preview --port 5173`
- Backend: not started — all API calls stubbed via `page.route()`
- Playwright version: 1.60.0
- Browser: Chromium (Desktop Chrome)
- Traces: `projects/invoice-tracker/frontend/test-results/` (retained on failure only; no failures recorded)

## Notes

The `DashboardDateFilter` popover uses `onInteractOutside={(e) => e.preventDefault()}` to prevent the popover from closing when clicking outside, matching the project requirement that the popover must only close when OK (Apply) or Cancel (Clear) is clicked. The date-filter test validates this behaviour is consistent with the production component.
