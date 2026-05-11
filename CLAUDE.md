# invoice-tracker — project conventions

You are inside `projects/invoice-tracker/`. This project was scaffolded by the agenticai framework at `C:\Users\ExpertBook\agenticai\`. The framework's `.claude/`, `templates/`, and `workflows/` are the **source of truth** for agent behaviour and quality gates.

## Stack

- **Backend**: Spring Boot 3.5.3, Java 21, Maven. Package root: `com.example.invoicetracker`.
- **Frontend**: Vite + React 18 + TypeScript 5 (strict) + Tailwind v4. Package manager: pnpm.
- **Database**: Postgres 16 (local via `docker-compose.yml`).
- **Auth**: Spring Security HTTP Basic by default. Switch to OIDC by editing `backend/src/main/java/.../config/SecurityConfig.java` and the matching frontend slice.

## Environment (machine-specific — do not change without re-verifying)

- **Java 21** is at `C:\Users\ExpertBook\.jdks\temurin-21.0.4`. Always set `JAVA_HOME` before running Maven:
  ```
  JAVA_HOME=/c/Users/ExpertBook/.jdks/temurin-21.0.4 ./mvnw ...
  ```
- **Maven wrapper** (`mvnw` / `mvnw.cmd`) is present at `backend/`. Never call bare `mvn` for project builds — always use `./mvnw`.
- **Docker** is available and running (required for Testcontainers integration tests).
- **`-Pfast` profile** skips OWASP Dependency-Check and PMD for fast inner-loop runs. CI always runs without `-Pfast`.
- **H2** is on the test classpath (for the `test` Spring profile used by `ApplicationTests`). Do not remove it.

## Toggling checks

Every quality gate is listed in `projects/invoice-tracker/CHECKS.yml`. Set any key to `false` to disable that check in all agent runs and in CI. The `backend/checks-flags.sh` script converts the file into Maven `-D` flags automatically.

## Build commands

```bash
# Fast inner loop (skip OWASP DC + PMD):
JAVA_HOME=/c/Users/ExpertBook/.jdks/temurin-21.0.4 ./mvnw -Pfast verify

# Full CI-equivalent (all gates):
JAVA_HOME=/c/Users/ExpertBook/.jdks/temurin-21.0.4 ./mvnw verify
```

Both commands must be run from `projects/invoice-tracker/backend/`.

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
- **Test security**: Use `@WithMockUser` in `@WebMvcTest` slices — do not call `httpBasic(user, randomPassword)` because Boot auto-generates a random password for the in-memory user. For `@SpringBootTest` integration tests, fix credentials via `spring.security.user.name/password` in the `properties` attribute of `@SpringBootTest`.
- **JPA session**: `ClientRepositoryAdapter.save()` checks `entityManager.find()` first so that updates within the same transaction use the already-managed entity (avoids `NonUniqueObjectException` on merge). Do not bypass this pattern.
- **Flyway + Postgres**: `flyway-database-postgresql` must be on the classpath alongside `flyway-core` for Flyway 10+. It is already declared in `pom.xml`.

## Known pom.xml decisions

| Decision | Reason |
|---|---|
| Spring Boot `3.5.3` (not `4.x`) | Boot 4 removed `@WebMvcTest` / `@DataJpaTest` from `spring-boot-test-autoconfigure`; Boot 3.5 is the current stable release. |
| `maven-failsafe-plugin` added | Runs `*IT` integration tests in the `integration-test` phase; Surefire only picks up `*Test` by convention. |
| JaCoCo `merge` + `check` on merged exec | Unit (`jacoco.exec`) and IT (`jacoco-it.exec`) data is merged into `jacoco-merged.exec` before the gate check, so both layers contribute to the 95% threshold. |
| `com.h2database:h2` test-scoped | The `test` Spring profile (used by `ApplicationTests`) points at an in-memory H2 datasource; H2 is not pulled transitively. |

## Quality gates (see framework `workflows/QUALITY_GATES.md`)

| Backend | Frontend |
|---|---|
| JaCoCo line + branch ≥ 90 % | Vitest 90 / 90 / 90 / 90 |
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
