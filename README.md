# invoice-tracker

Scaffolded by the [agenticai](../../README.md) framework.

## Layout

- `backend/` — Spring Boot 4.0.6 service (Java 21, Maven).
- `frontend/` — React 18 + Vite + Tailwind v4 SPA (pnpm).
- `docs/` — architecture, features, changelog, sequence diagrams, API, security.
- `postman/` — collection + local-dev environment (auto-refreshed per feature).
- `.features/` — per-feature workspace driven by the agentic pipeline.

## Run locally

```powershell
docker compose up -d postgres

cd backend && ./mvnw spring-boot:run
# new terminal
cd frontend && pnpm install && pnpm dev
# → frontend at http://localhost:5173
# → backend  at http://localhost:8080
# → docs     at http://localhost:8080/swagger-ui.html
```

## Deliver a feature

```
/new-feature invoice-tracker "<title>"
/approve-plan invoice-tracker <FEAT-id>      # after reviewing PLAN.md
/run-security invoice-tracker <FEAT-id>
/run-qa invoice-tracker <FEAT-id>
/finalize-feature invoice-tracker <FEAT-id>  # docs + commit + push + PR
```
