---
status: partial
generated_at: 2026-05-14T15:30:00Z
browser_automation: false
---

## Specs added

- `projects/invoice-tracker/frontend/tests/dashboard/dashboard.spec.ts` — Asserts AC-3: authenticated user navigates to `/`, welcome banner visible, exactly 4 stat cards visible via `[data-testid="stat-cards"]`, revenue chart section visible via `[data-testid="revenue-chart-section"]`, status donut chart section visible via `[data-testid="status-chart-section"]`. Also includes a smoke suite: unauthenticated redirect to `/login`, sidebar navigation to `/invoices`. All API calls intercepted with `page.route()` — no live backend required, only a running Vite dev server.
- `projects/invoice-tracker/frontend/tests/dashboard/mark-paid.spec.ts` — Asserts AC-2 + AC-4: SENT invoice detail page shows `[data-testid="mark-as-paid-btn"]`; clicking it sends `PATCH /api/v1/invoices/{id}/mark-paid`, then `[data-testid="status-badge"]` flips `data-status` to `PAID` and the button disappears. PAID invoice suppresses the button on load. Invoices list page shows a `Status` column header and a `StatusBadge` in every row. Also covers palette switch (AC-11): PaletteToggle dropdown adds `.palette-teal-steel` to `<html>` and removes it when toggled back to Navy & Amber. Covers dark/light theme toggle: ThemeToggle dropdown adds/removes `.dark` class on `<html>`.

## Results

- `tests/dashboard/dashboard.spec.ts`: **8 skipped / 0 failed** — spec parses and enumerates correctly; skipped because Vite dev server was not running at authoring time.
- `tests/dashboard/mark-paid.spec.ts`: **7 skipped / 0 failed** — spec parses and enumerates correctly; skipped because Vite dev server was not running at authoring time.
- Total: **15 skipped, 0 failed, 0 errored**.

## Why partial, not fail

Per QA agent instructions: "If the backend is not reachable (no running server at localhost:8080), write the specs with `test.skip` annotations and note this in QA.md, then emit `status: partial` instead of `pass` or `fail`. Do not fail the gate solely because the backend is unavailable in this CI-less environment."

Both `localhost:8080` (backend) and `localhost:5173` (Vite dev server) returned connection timeouts at QA-run time. The specs themselves use `page.route()` mocking and require only a running Vite dev server — they do not need the backend directly. To execute the full suite:

1. Start the database: `docker-compose up -d` from `projects/invoice-tracker/`.
2. Start the backend: `cd projects/invoice-tracker/backend && JAVA_HOME=/c/Users/ExpertBook/.jdks/temurin-21.0.4 ./mvnw spring-boot:run` (background).
3. Start the frontend: `cd projects/invoice-tracker/frontend && pnpm dev` (background).
4. Wait for Vite port (check startup log — may differ from 5173).
5. Run: `BASE_URL=http://localhost:<port> pnpm exec playwright test tests/dashboard/ --reporter=line`.
6. Remove the `test.skip(true, ...)` annotations from both spec files, or pass `--grep` to run only the non-skipped suites.

## Acceptance criteria coverage

| AC | Description | Spec | Status |
|---|---|---|---|
| AC-2 | `PATCH /mark-paid` transitions status → PAID; 404 if not found | `mark-paid.spec.ts` — "SENT invoice shows MarkAsPaidButton…" + route stub returning 200/PAID | Skipped (authored) |
| AC-3 | Home page renders banner + 4 stat cards + revenue chart + donut chart | `dashboard.spec.ts` — "exactly 4 stat cards", "revenue chart section visible", "status chart section visible" | Skipped (authored) |
| AC-4 | InvoicesListPage Status column + StatusBadge; detail page badge + MarkAsPaidButton hidden when PAID | `mark-paid.spec.ts` — "invoices list page shows Status column", "PAID invoice does not show MarkAsPaidButton" | Skipped (authored) |
| AC-11 (palette) | `.palette-teal-steel` added/removed on `<html>` when PaletteToggle cycles | `mark-paid.spec.ts` — "clicking PaletteToggle → Teal & Steel adds .palette-teal-steel" | Skipped (authored) |
| Dark/light toggle | `.dark` class toggles on `<html>` via ThemeToggle | `mark-paid.spec.ts` — "switching to dark mode adds .dark", "switching back to light removes .dark" | Skipped (authored) |
| AC-1, AC-5–AC-10 | Backend contract, no hardcoded hex, token architecture, coverage, Postman, OpenAPI | Covered by backend/frontend unit + integration tests and reviewer gate — outside Playwright E2E scope | N/A |

## Traces

No trace files — all tests were skipped before connecting to a browser.
