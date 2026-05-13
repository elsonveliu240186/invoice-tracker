---
status: pass
iteration: 3
reviewer: claude-sonnet
generated_at: 2026-05-12T13:35:00Z
---

## Summary

Iteration 3 addresses the Flyway wiring root cause identified in the previous review: Spring Boot 4's FlywayAutoConfiguration was moved into the dedicated `spring-boot-starter-flyway` module (absent from the project, which only declared `flyway-core`). The fix replaces `flyway-core` with `spring-boot-starter-flyway` in pom.xml, moves `spring.flyway.enabled: true` and the shared JPA settings to the base (non-profile) section of application.yml so they apply when no profile is active, and adds `@Transactional` to `ClientRepositoryAdapter.save()` to ensure entity updates are committed when the adapter is called directly from integration tests. The Maven build (`-Pfast verify`) exits 0: 26 unit tests and 8 integration tests (34 total) all pass, JaCoCo coverage gate is met, Checkstyle reports 0 violations, SpotBugs reports 0 bugs, PMD is skipped under `-Pfast` as designed. Frontend Vitest runs 79 tests green with 99.31 % statements / 92.13 % branch / 100 % functions / 99.31 % lines — above all configured thresholds (95/90/95/95). All acceptance criteria remain satisfied. No new required findings.

## Findings

### Required (blocking)

None.

### Recommended (non-blocking)

- [ ] `backend/src/main/java/com/example/invoicetracker/adapter/persistence/client/ClientEntityMapper.java` (throughout) — Checkstyle reports indentation warnings (4-space indent inside class body instead of 2-space per configured tab width). The project-wide Checkstyle config expects 2-space indentation; entire codebase consistently uses 4-space. Consider aligning the Checkstyle `indentation` module's `basicOffset` setting to 4 to eliminate noise, or reformat sources. Violations are warnings only and do not block the build.
- [ ] `backend/src/main/java/com/example/invoicetracker/shared/lib/http.ts:41` — branch at line 41 of `http.ts` is not covered (83.33 % branch in `shared/lib`). Adding a test for the uncovered path would push `shared/lib` branch coverage above 90 %. Non-blocking since aggregate branch coverage (92.13 %) already clears the 90 % gate.
- [ ] `backend/src/main/java/com/example/invoicetracker/adapter/web/client/ClientController.java` — Checkstyle indentation warnings across all controller methods (same root cause as mapper). Non-blocking.

## Coverage check

- Backend JaCoCo (merged exec, 7 filtered classes): gate ≥ 90 % line + branch — **pass** ("All coverage checks have been met." per jacoco:check output)
- Frontend Vitest: Stmts 99.31 % / Branch 92.13 % / Funcs 100 % / Lines 99.31 % (gates: 95/90/95/95) — **pass**

## Plan adherence

- Every acceptance criterion mapped to code + tests? **yes**
  - AC-1 (POST 201): `ClientControllerTest.create_returns_201_with_location`, `ClientControllerIT.create_then_get_then_delete_round_trip`
  - AC-2 (GET paginated list): `ClientControllerTest.list_returns_page_envelope`, `ClientRepositoryAdapterIT.pagination_returns_expected_slice`, `ClientRepositoryAdapterIT.search_is_case_insensitive_on_name_and_email`
  - AC-3 (GET by id / 404): `ClientControllerTest.get_returns_404_when_not_found`, `ClientRepositoryAdapterIT.soft_deleted_row_is_excluded_from_queries`
  - AC-4 (PUT 200): covered by `ClientServiceTest`, `ClientControllerIT` round-trip
  - AC-5 (DELETE soft): `ClientServiceTest.delete_sets_deletedAt_and_persists`, `ClientRepositoryAdapterIT.soft_deleted_row_is_excluded_from_queries`
  - AC-6 (validation): `ClientControllerTest` validation tests (blank name, invalid email, bad phone pattern)
  - AC-7 (409 duplicate email): `ClientControllerTest.create_returns_409_when_email_taken`, `ClientControllerIT.duplicate_email_returns_409`, `ClientRepositoryAdapterIT.unique_email_constraint_blocks_duplicates`
  - AC-8 (401 unauthenticated): `ClientControllerTest.unauthenticated_returns_401`, `ClientControllerIT.unauthenticated_request_returns_401`
  - AC-9 (React UI): covered by 79 Vitest tests (ClientsPage.test.tsx, ClientForm.test.tsx, clientsApi.test.ts, schema.test.ts, http.test.ts)
  - AC-10 (coverage gates): backend JaCoCo pass, frontend Vitest pass
  - AC-11 (Postman + OpenAPI): Postman collection.json has Clients folder (5 requests); springdoc annotations present in ClientController
  - AC-12 (Flyway migration idempotent): V1__create_clients.sql applied cleanly by both ClientRepositoryAdapterIT and ClientControllerIT via Testcontainers
- Files outside the plan's change list: none identified in the fix commit (7908e83). Changed files — `backend/pom.xml`, `backend/src/main/resources/application.yml`, `ClientRepositoryAdapter.java`, `.features/FEAT-20260511-01/HISTORY.md`, `.features/FEAT-20260511-01/REVIEW.md`, `.features/FEAT-20260511-01/STATE.json`, `CLAUDE.md` — are all either within the plan's backend change list or framework artefacts.
