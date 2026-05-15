# invoice-tracker

Scaffolded by the [agenticai](../../README.md) framework.

## Layout

- `backend/` — Spring Boot 4.0.6 service (Java 21, Maven).
- `frontend/` — React 18 + Vite + Tailwind v4 SPA (pnpm).
- `docs/` — architecture, features, changelog, sequence diagrams, API, security.
- `postman/` — collection + local-dev environment (auto-refreshed per feature).
- `.features/` — per-feature workspace driven by the agentic pipeline.

## Quick start (full Docker stack)

The recommended way to run everything — no local Java or Node required.

```bash
docker compose up --build
```

| Service | URL |
|---------|-----|
| Frontend (nginx) | http://localhost:5173 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui.html |
| OpenAPI JSON | http://localhost:8080/v3/api-docs |

Default credentials (HTTP Basic): **admin / secret**

> The stack starts in dependency order: Postgres → Backend (waits for healthy DB) → Frontend (waits for healthy backend). First build takes ~2 min; subsequent starts are fast.

### Useful compose commands

```bash
# Start (rebuild images if source changed)
docker compose up --build

# Start in background
docker compose up -d --build

# Tail logs
docker compose logs -f

# Stop and remove containers (data volume preserved)
docker compose down

# Wipe everything including the Postgres volume
docker compose down -v
```

### Override credentials / ports

Create a `.env` file in the project root:

```env
POSTGRES_USER=myuser
POSTGRES_PASSWORD=mypassword
API_USER=admin
API_PASSWORD=changeme
```

## Run locally (without Docker)

If you prefer to run the backend and frontend directly on your machine:

```powershell
# 1. Start only Postgres in Docker
docker compose up -d postgres

# 2. Backend (requires Java 21 at C:\Users\ExpertBook\.jdks\temurin-21.0.4)
$env:JAVA_HOME = "C:\Users\ExpertBook\.jdks\temurin-21.0.4"
cd backend
./mvnw spring-boot:run

# 3. Frontend (new terminal — requires pnpm)
cd frontend
pnpm install
pnpm dev
# → http://localhost:5173
```

## E2E tests (Playwright)

The E2E suite runs against the full Docker stack.

```bash
# Start the stack first
docker compose up -d --build

# Run all specs (headless)
cd frontend
BASE_URL=http://localhost:5173 pnpm exec playwright test --reporter=line

# Run a specific suite
BASE_URL=http://localhost:5173 pnpm exec playwright test tests/dashboard-core-ui/ --reporter=line
```

## Deliver a feature

```
/new-feature invoice-tracker "<title>"
/approve-plan invoice-tracker <FEAT-id>      # after reviewing PLAN.md
/run-security invoice-tracker <FEAT-id>
/run-qa invoice-tracker <FEAT-id>
/finalize-feature invoice-tracker <FEAT-id>  # docs + commit + push + PR
```
