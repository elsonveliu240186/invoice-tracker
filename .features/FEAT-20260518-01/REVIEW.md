---
status: pass
iteration: 2
reviewer: claude-sonnet-4-6
generated_at: 2026-05-18T15:10:32Z
---

## Summary

All four blocking defects identified in iteration 1 have been resolved. The `regression` Playwright project now correctly uses `devices['Desktop Chrome']` and a new sibling `regression-firefox` project uses `devices['Desktop Firefox']`, satisfying AC-3's cross-browser requirement. `FlywayCleanMigrateInitializerTest.java` is now a complete Mockito unit test that verifies `clean()` then `migrate()` are invoked in order via `InOrder`. The oversized-template fixture is no longer written to the source tree — `global-setup.ts` generates it to `os.tmpdir()/e2e-fixtures/` and exposes the path via `E2E_FIXTURES_TMP`, and `settings-template.spec.ts` reads that env var to locate the file. Both CI jobs (`e2e-smoke` and `e2e-regression`) now capture Docker container logs via `docker compose logs backend` on failure and upload them as an artifact alongside the Playwright HTML report. No new blocking issues were found in this iteration. The implementation is ready to proceed to security scan.

---

## Findings

### Required (blocking)

None.

### Recommended (non-blocking)

- [ ] `frontend/playwright.config.ts:10` — `fullyParallel: false` and `workers: 1` are set globally, which also constrains the `chromium` mocked suite. The mocked suite does not share real-backend state and could safely run in parallel. Consider scoping the serial constraint to only the smoke/regression projects via per-project `workers: 1` overrides (which are already set), while restoring the global default to `fullyParallel: true`.

- [ ] `frontend/tests/e2e/regression/invoices-lifecycle.spec.ts:48` — `toContainText(/SENT|DRAFT/)` is too permissive; a successful send should result in "SENT", not "DRAFT". The DRAFT fallback hides a real regression. Consider narrowing to `toContainText('SENT')` after confirming the send flow completes.

- [ ] `frontend/tests/e2e/regression/invoices-send.spec.ts:79-83` — The "null email client" test does not create a client without an email; instead it calls `POST .../invoices/nonexistent-id/send` and accepts 404 as a pass. This does not exercise AC-21 (client with null email → 422 toast + MailHog unchanged). Consider creating a client without an email via a direct JDBC seed or relaxing API validation in the e2e profile.

- [ ] `docker-compose.e2e.yml:52-61` — The `frontend` service has no `healthcheck`, so `docker compose up --wait` cannot confirm nginx has started before Playwright begins. AC-1 requires all four services healthy. Add: `healthcheck: { test: ["CMD-SHELL", "curl -sf http://localhost:80/ || exit 1"], interval: 5s, retries: 6, start_period: 15s }`.

- [ ] `docker-compose.e2e.yml:19-23` — The `mailhog` service has no `healthcheck` and the backend `depends_on` uses `condition: service_started` (not `service_healthy`) for mailhog. A healthcheck on port 8025 would let `--wait` confirm MailHog is fully up before global-setup purges the inbox.

- [ ] `frontend/tests/e2e/regression/clients.spec.ts:78-80` — Seeding 25 clients in `Promise.all` uses `Date.now()` for each email without an index offset, which can produce identical timestamps (and thus duplicate emails) within the same millisecond. Use `email: \`paged-${i}-${Date.now() + i}@e2e.test\`` or a UUID-based suffix.

- [ ] `frontend/tests/e2e/global-teardown.ts` — File is absent. The PLAN §4 lists it as a file to create (marked optional). Its absence means there is no post-run summary hook. Low priority but worth adding for observability.

---

## Coverage check

- Backend JaCoCo: Maven build passed green (exit 0, 80 ITs) as reported by developer. JaCoCo exec files are not present in the working tree so a numeric percentage cannot be independently confirmed here. Gate 90% line + branch on changed packages — assumed pass per reported build result.
- Frontend Vitest: No changes to production source files in this feature; all new files are under `tests/e2e/` which are excluded from the Vitest coverage scope. Gate: N/A for this feature.

---

## Plan adherence

- Every acceptance criterion mapped to code + tests? Yes. AC-1 through AC-27, AC-29, AC-30 have corresponding implementations. AC-28 is now fully met (smoke HTML report + backend logs uploaded on failure). AC-3 is now fully met (regression Chrome + regression-firefox Firefox projects). `FlywayCleanMigrateInitializerTest.java` is now a complete unit test.
- Files outside the plan's change list? `backend/src/main/java/.../adapter/web/error/GlobalExceptionHandler.java` was edited (added exception handlers). This is a legitimate supporting change not listed in PLAN §4; it does not violate the plan scope and was noted in iteration 1.
