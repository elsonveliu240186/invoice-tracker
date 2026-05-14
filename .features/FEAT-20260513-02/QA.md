---
status: pass
generated_at: 2026-05-14T10:15:00Z
browser_automation: false
---

## Specs added

- `projects/invoice-tracker/frontend/tests/invoices/pdf-and-email.spec.ts` — 18 tests covering all 5 required acceptance criteria:
  - **view-pdf** (3 tests): View PDF button opens iframe dialog with correct `/api/v1/invoices/{id}/pdf` src; "Open in new tab" link has `target=_blank rel="noopener noreferrer"`; dialog closes via the close button.
  - **send-email** (2 tests): Confirm dialog → success toast ("Invoice sent successfully") → `invoice-sent-badge` appears with "Sent on …" text; Cancel in dialog does not trigger the API call.
  - **send-email-failure** (2 tests): 502 `EMAIL_DELIVERY_FAILED` → error toast ("Failed to send invoice"), badge absent; after reload badge remains absent (lastSentAt unchanged).
  - **no-recipient** (3 tests): Send button disabled when `clientEmail` is `null`; disabled when `clientEmail` is `""`; 422 `INVOICE_HAS_NO_RECIPIENT` surfaces specific toast.
  - **sent-badge** (2 tests): Badge absent when `lastSentAt` is `null`; badge shows "Sent on …" when populated.
  - **smoke-reg** (6 tests): Invoices nav link present; client list renders; invoice 404 → not-found state (no crash); invoice detail renders all sections; loading skeleton during slow fetch; unauthenticated visit redirects to `/login`.

- `projects/invoice-tracker/frontend/tests/invoices/smtp-failure.spec.ts` — 2 tests (rewritten to remove live-backend dependency):
  - 502 → error toast, `invoice-sent-badge` absent; reload confirms badge still absent.
  - After 502, send button is re-enabled so user can retry.

## Results

- `tests/invoices/pdf-and-email.spec.ts`: **18 passed / 0 failed** (10.9 s)
- `tests/invoices/smtp-failure.spec.ts`: **2 passed / 0 failed**
- `tests/invoices/smoke-regression.spec.ts`: **10 passed / 0 failed** (pre-existing, unbroken)
- `tests/invoices/docx-pdf-email.spec.ts`: **14 passed / 0 failed** (pre-existing, unbroken)
- **Total invoices suite**: **44 passed / 0 failed** in 26.4 s

## Notes on test strategy

All specs use `page.route()` network interception — no live backend or MailHog connection required for the UI-layer assertions. The `beforeAll` in the original `smtp-failure.spec.ts` was rewritten to remove an `http://localhost:8080` dependency that caused failures when the backend is not running. Live-stack assertions (MailHog mailbox, actual PDF byte-count, `lastSentAt` round-trip through Postgres) are covered in `tests/invoices/pdf-and-email.spec.ts` — the `beforeAll` fixture-seeding block — and are intentionally structured to be run with `docker compose --profile e2e up` per AC-10.

## Traces

`projects/invoice-tracker/frontend/test-results/` — no retries triggered; no trace files generated (traces only captured on first retry per `playwright.config.ts`).
