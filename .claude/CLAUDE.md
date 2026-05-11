# invoice-tracker — project conventions

You are inside `projects/invoice-tracker/`. This project was scaffolded by the agenticai framework at `C:\Users\ExpertBook\agenticai\`. The framework's `.claude/`, `templates/`, and `workflows/` are the **source of truth** for agent behaviour and quality gates.

## Stack

- **Backend**: Spring Boot 4.0.6, Java 21, Maven. Package root: `com.example.invoicetracker`.
- **Frontend**: Vite + React 18 + TypeScript 5 (strict) + Tailwind v4. Package manager: pnpm.
- **Database**: Postgres 16 (local via `docker-compose.yml`).
- **Auth**: Spring Security HTTP Basic by default. Switch to OIDC by editing `backend/src/main/java/.../config/SecurityConfig.java` and the matching frontend slice.

## Layout

```
projects/invoice-tracker/
├── backend/          — Spring Boot service
├── frontend/         — React SPA
├── docs/             — ARCHITECTURE, FEATURES, CHANGELOG, SEQUENCE, API, SECURITY (mermaid-rich)
├── postman/          — collection.json + local-dev.environment.json (auto-refreshed)
├── .features/        — per-feature workspace (PLAN/REVIEW/SECURITY/QA/DOCS/STATE/HISTORY)
└── .github/workflows/ci.yml — CI pipeline
```

## Conventions

- **Backend**: `domain/`, `application/`, `adapter/web/`, `adapter/persistence/`, `config/`. DTOs are records; Lombok only on JPA entities. Migrations via Flyway in `src/main/resources/db/migration/V<n>__<name>.sql`.
- **Frontend**: Feature-sliced — `src/features/<name>/{ui,model,api}` for feature work; `src/shared/{ui,lib,api}` for cross-feature pieces. Tests colocated as `*.test.tsx`. E2E specs in `tests/`.
- **API versioning**: paths prefixed with `/api/v1/`. Breaking changes go to `/api/v2/`.
- **Logging**: SLF4J; never `System.out`. INFO for business events, DEBUG for diagnostics. No PII or secrets in logs.

## Quality gates (see framework `workflows/QUALITY_GATES.md`)

| Backend | Frontend |
|---|---|
| JaCoCo line + branch ≥ 95 % | Vitest 95 / 95 / 95 / 90 |
| OWASP DC fail at CVSS ≥ 7 | `pnpm audit --audit-level=high` |
| Checkstyle + SpotBugs + PMD must pass | ESLint flat config must pass |

## How features are delivered

Every change goes through:

```
/new-feature invoice-tracker "<title>"   → planner writes PLAN.md
(human edits & approves)                 → /approve-plan invoice-tracker <id>
                                         → developer agents implement
                                         → reviewer → security-auditor → qa-automation
/finalize-feature invoice-tracker <id>   → documentation agent + devops agent
```

`/status invoice-tracker` prints the table of in-flight features.

## Tuning

Edit framework files at `C:\Users\ExpertBook\agenticai\`:

- `.claude/agents/*.md` — change an agent's prompt / model / tools.
- `workflows/*.md` — change thresholds and checklists.
- `templates/*` — change the **next** scaffolded project (does not affect this one retroactively — re-copy manually if needed).
