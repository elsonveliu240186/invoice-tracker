# Backend

Spring Boot 4.0.6 service, Java 21, Maven.

## Run locally

```powershell
# Postgres for the `local` profile
docker compose -f ..\docker-compose.yml up -d postgres

./mvnw spring-boot:run
# → http://localhost:8080
# → http://localhost:8080/swagger-ui.html
# → http://localhost:8080/actuator/health
```

## Tests

```powershell
./mvnw -B verify          # full pipeline: tests, JaCoCo 95 % gate, OWASP DC, Checkstyle, SpotBugs, PMD
./mvnw -Pfast verify      # inner-loop: skip OWASP DC + PMD (CI does NOT use this profile)
```

## Conventions

- Package layout: `domain` / `application` / `adapter/web` / `adapter/persistence` / `config`.
- DTOs are `record`. JPA entities may use Lombok.
- Public endpoints: secure by default; explicitly allow-list under `SecurityConfig`.
- Migrations in `src/main/resources/db/migration/V<n>__<name>.sql` (Flyway).
- Document endpoints with springdoc annotations — the documentation agent reads `/v3/api-docs` to refresh API docs and Postman.

## Coverage gate

`pom.xml` enforces JaCoCo line + branch ≥ 0.95 on bundled code, excluding DTOs/entities/config and the `Application` class. To raise the gate, edit `<jacoco.minimum>` in `pom.xml` and mirror in `workflows/QUALITY_GATES.md`.
