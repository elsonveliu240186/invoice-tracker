# True E2E smoke suite — full-stack boot, happy + failure paths per flow, clean environment per run

## User request

We need real end-to-end tests that actually hit the backend and database — not mocked Playwright tests. At minimum one happy path and one failure path per major flow:

- Login / authentication
- Client create / save
- Invoice create and save
- Invoice send (email)
- Any other key flows

Each run should boot a clean environment (fresh DB) so tests are deterministic and can serve as smoke tests and regression gates. Without this we can't know if anything is actually working end-to-end.
