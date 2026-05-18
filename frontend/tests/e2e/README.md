# E2E Test Suite

Real-stack end-to-end tests for invoice-tracker.  
The tests require a running Docker Compose stack (Postgres + MailHog + Spring Boot + nginx).

## Prerequisites

- Docker + Docker Compose v2
- Node.js 20+ / pnpm 9+
- `@playwright/test` browsers installed
- For accessibility tests (regression/accessibility.spec.ts): `pnpm add -D @axe-core/playwright`
  - Without this package, a11y tests warn and pass gracefully

## Quick start

```bash
# 1. Build and start all services
cd projects/invoice-tracker
pnpm --prefix frontend e2e:up

# 2. Run smoke suite (fast, Chrome only, ~3 min)
cd frontend
pnpm e2e:smoke

# 3. Run regression suite (thorough, Chrome + Firefox, ~12 min)
pnpm e2e:regression

# 4. Tear down
pnpm e2e:down
```

## Environment

Variables are read from `.env.e2e` at the project root.  
Playwright reads them via `process.env`:

| Variable | Default | Purpose |
|---|---|---|
| `E2E_BASE_URL` | `http://localhost:8081` | Frontend nginx URL |
| `E2E_API_URL` | `http://localhost:8082` | Backend Spring Boot URL |
| `E2E_MAILHOG_URL` | `http://localhost:8026` | MailHog REST API |
| `E2E_USERNAME` | `admin` | Admin user email |
| `E2E_PASSWORD` | `Secret1!` | Admin user password |

## Architecture

```
docker-compose.e2e.yml
  ├── postgres:16-alpine  (tmpfs — clean DB each restart)
  ├── mailhog:v1.0.1      (SMTP :1026, REST UI :8026)
  ├── backend             (Spring Boot, profile=e2e, :8082)
  └── frontend            (nginx, :8081)
```

## Suite structure

```
tests/e2e/
  global-setup.ts          — ping health, register admin user, purge MailHog
  fixtures/
    api.ts                 — raw HTTP helpers (createClient, createInvoice, …)
    factory.ts             — TestDataFactory (typed builders)
    test.ts                — extended test fixture (per-test DB reset + MailHog purge)
    files/
      sample-template.docx — valid .docx for upload tests
      evil.exe             — fake binary for rejection test
  pages/                   — Page Object Model classes
  smoke/                   — 7 happy-path specs (Chrome only)
  regression/              — 12 thorough specs (Chrome + Firefox)
```

## Running in CI

CI jobs `e2e-smoke` (every PR) and `e2e-regression` (nightly) handle the Docker stack automatically.  
See `.github/workflows/ci.yml` for details.

## Debugging

```bash
# Run headed (see the browser)
pnpm exec playwright test --project=smoke --headed

# Show trace viewer after a failure
pnpm exec playwright show-trace playwright-report/trace.zip

# Debug single test
pnpm exec playwright test --project=smoke tests/e2e/smoke/auth.spec.ts --debug
```

## Security note

`.env.e2e` contains **test-only credentials** with no real secrets.  
The `E2eResetController` is only active under `SPRING_PROFILES_ACTIVE=e2e` — it returns 404 in all other profiles.
