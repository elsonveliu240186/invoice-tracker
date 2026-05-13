---
feature_id: FEAT-20260511-01
title: Client management (CRUD)
generated_at: 2026-05-11T22:00:00Z
generated_by: documentation-agent (claude-sonnet-4-6)
---

# DOCS.md — FEAT-20260511-01 Client management (CRUD)

Summary of every documentation and Postman artefact touched during this feature's documentation pass.

---

## Changed files

### `docs/ARCHITECTURE.md`

What changed: Added five new ADR entries (ADR-001 through ADR-005) under the existing Decisions log.

- ADR-001: Soft-delete pattern — `deleted_at` column, explicit `IS NULL` predicates, rationale for not using Hibernate `@SQLDelete`.
- ADR-002: Partial unique index on `lower(email) WHERE deleted_at IS NULL` — why a plain UNIQUE constraint is insufficient when clients can be re-registered after deletion.
- ADR-003: Pagination size capped at 100 — server-side enforcement against DoS.
- ADR-004: CSRF disabled for `/api/v1/**` — stateless HTTP Basic makes CSRF protection unnecessary; migration note for when OIDC is added.
- ADR-005: Spring Boot 3.5.3 pinned over 4.x — Boot 4 dropped `@WebMvcTest`/`@DataJpaTest`; corrected the stale `4.0.6` reference in ADR-000.

Why: Architecture decisions made during implementation were not recorded; these ADRs make the trade-offs auditable for future contributors.

---

### `docs/FEATURES.md`

What changed: Replaced the placeholder `_no features yet_` row with a data row for FEAT-20260511-01.

Columns populated: ID, title ("Client management (CRUD)"), state (Done), owner (elsonveliu), links to PLAN.md / REVIEW.md / SECURITY.md / QA.md.

Why: The table was empty; this is the first shipped feature.

---

### `docs/CHANGELOG.md`

What changed: Refined the existing `Client management CRUD` entry under `[Unreleased] ### Added`. The entry previously omitted the partial unique index, pagination cap, problem-detail bodies, Playwright E2E spec count, and breaking-change flag. The revised entry is more complete and accurate while remaining concise.

Breaking changes: none — this is a net-new API surface with no removals or renames.

Why: The entry added during development was correct in outline but underspecified. Reviewers and downstream consumers need the pagination cap and soft-delete details to understand the contract.

---

### `docs/SEQUENCE_DIAGRAMS.md`

What changed: Appended a new `### FEAT-20260511-01 — Client management (CRUD)` section with two mermaid sequence diagrams copied verbatim from PLAN.md §4:

1. Happy path — create client (POST → 201, with DB round-trip).
2. Error path — duplicate email (POST → 409 problem+json, inline field error).

Why: The file previously contained only the conventions header; no feature diagrams had been appended yet.

---

### `docs/SECURITY.md`

What changed: Replaced the placeholder `_` row in the History table with a real entry for FEAT-20260511-01.

Columns: date (2026-05-11), feature, finding summary (no required fixes; two Moderate dev-only CVEs), severity (Low), resolution (upgrade recommended), reference link to the feature's SECURITY.md.

Why: The history table must record every security audit result so the project's cumulative OWASP posture is visible over time.

---

### `docs/API.md` — no changes required

Verified against `ClientController.java` (all five handler methods, paths, HTTP methods, response codes) and `V1__create_clients.sql` (column names, lengths, constraints). The existing content accurately reflects:

- All five endpoints with correct HTTP methods, paths, and response codes.
- `CreateClientRequest` and `UpdateClientRequest` field constraints matching the implementation.
- `ClientResponse` fields matching `ClientController.toResponse()` and `frontend/src/features/clients/model/types.ts`.
- `PageResponse` envelope shape matching the controller's `PageResponse<ClientResponse>` return.
- RFC 7807 problem-detail schema and all five error codes (`VALIDATION_FAILED`, `CLIENT_NOT_FOUND`, `CLIENT_EMAIL_TAKEN`, `UNAUTHENTICATED`, `INTERNAL_ERROR`).

No edits needed.

---

### `postman/collection.json` — no changes required

Verified: the `Clients` folder contains exactly five requests (List Clients, Create Client, Get Client, Update Client, Delete Client) with correct HTTP methods, URL templates using `{{baseUrl}}/api/{{apiVersion}}/clients`, Basic auth via `{{username}}`/`{{password}}`, example request bodies, and `pm.test` assertions that match the API contract.

The Create Client test script sets `clientId` in the environment from the response body; the List Clients script also seeds `clientId` from the first content item. Both are correct.

No edits needed.

---

### `postman/local-dev.environment.json` — no changes required

Verified: all required variables present — `baseUrl` (http://localhost:8080), `apiVersion` (v1), `username` (user), `password` (secret type), `authToken` (secret type, empty — for future OIDC use), `clientId` (default type, empty — populated at runtime by test scripts).

No edits needed.

---

## Accuracy notes from implementation cross-check

- `ClientController.java` confirms: `@RequestMapping("/api/v1/clients")`, `@Tag(name = "Clients")`, all five operations annotated with `@Operation`. Response codes match PLAN.md §6.
- `V1__create_clients.sql` confirms: table DDL matches PLAN.md §7 exactly, including `version BIGINT NOT NULL DEFAULT 0`, `CONSTRAINT clients_name_not_blank`, and all three indexes.
- `types.ts` confirms: `Client`, `ClientPage`, `CreateClient`, `UpdateClient`, `ClientQuery` interfaces match `ClientResponse` and `PageResponse` shapes documented in API.md.
- Spring Boot version in use is `3.5.3` (per CLAUDE.md and REVIEW.md); ARCHITECTURE.md ADR-000 text corrected from `4.0.6` to `3.5.3`.
