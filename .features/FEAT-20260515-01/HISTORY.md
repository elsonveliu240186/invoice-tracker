# FEAT-20260515-01 History

- `Requested → Planning` at 2026-05-15T09:00:00Z
- `Planning → AwaitingApproval` at 2026-05-15T10:30:00Z — PLAN.md written by planner (claude-opus)
- `Planning → Developing` at 2026-05-15T09:35:28Z
- `Developing → Reviewing` at 2026-05-15T13:37:25Z — backend implementation complete: Flyway V9 migration, company profile domain/persistence/service/controller, invoice update endpoint, number auto-generation, InvoiceArtifactService company profile integration; all tests green, JaCoCo ≥ 90% branches+lines
- `Backend redesign complete` at 2026-05-15T16:45:00Z — DESIGN REVISION implemented: removed global CompanyProfile, added per-client company profile fields (V9 migration), added invoice snapshot fields (V10 migration); updated Client domain record (6 new fields), Invoice domain record (8 snapshot fields), all JPA entities, mappers, services, DTOs, controllers; InvoiceArtifactService now reads from invoice snapshots instead of CompanyProfileService; 263 unit tests + 51 IT tests pass (0 failures), JaCoCo branch+line ≥ 90% gate satisfied
