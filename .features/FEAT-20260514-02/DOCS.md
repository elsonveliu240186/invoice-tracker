---
feature_id: FEAT-20260514-02
title: invoice-template-editor-and-full-lifecycle
docs_agent: claude-sonnet-4-6
generated_at: 2026-05-15T00:00:00Z
---

# Documentation summary — FEAT-20260514-02

## Changed files

### docs/ARCHITECTURE.md

- **Backend components diagram** updated: `InvoiceController` entry expanded with 4 new endpoints and `DELETE /{id}`; new `InvoiceArtifactService` node in the `application` subgraph; new `GeneratedArtifactStore` port and `FilesystemGeneratedArtifactStore` adapter in a new `adapter.artifact` subgraph; new `GeneratedArtifactRepositoryAdapter` in `adapter.persistence`; `GeneratedArtifactProperties` config node; domain entities updated to include `GeneratedArtifact`, `ArtifactFormat`, `GeneratedArtifactRepository`, and the three new exception types; `invoice_generated_artifacts` table added to the Postgres node; `generated_invoices` Docker named volume added to the FS node.
- **New section "Invoice artifact lifecycle (FEAT-20260514-02)"** — flowchart LR showing the full FE → BE → DB → FS chain for the generate/download/preview/send-email flow. Includes the new `invoice_generated_artifacts` table column reference and the `GeneratedArtifactProperties` configuration table.
- **Frontend components diagram** updated: `PreviewInvoiceButton`, `GenerateInvoiceButton`, `GeneratedArtifactBadge`, `DownloadInvoiceMenu` (with saved-vs-live annotation), `SendInvoiceButton` (saved-PDF subtitle), `InvoiceTemplateManagerPage`, `PlaceholderReferenceCard`, `generatedArtifactApi.ts`, `useGeneratedArtifactsMetadata`, `artifact.ts` types all added to `InvoicesFeature` subgraph; `/invoices/template` route added as a guarded outlet.
- **ADR-023** — `FilesystemGeneratedArtifactStore` for v1; `GeneratedArtifactStore` port allows S3 swap.
- **ADR-024** — `overwrite=false` default on `POST /generate`; immutability rationale documented.
- **ADR-025** — VBA macro rejection added to `FilesystemInvoiceTemplateStore.validateZipStructure()`.

### docs/FEATURES.md

- Row for **FEAT-20260514-02** prepended to the summary table (state: Shipping).
- Full **FEAT-20260514-02** detail section added before FEAT-20260514-01: overview, sub-feature table, backend/frontend change summaries, quality gate results table, known open items (non-blocking), and security findings resolved.

### docs/CHANGELOG.md

- New `[Unreleased]` entry prepended for **FEAT-20260514-02** documenting: V8 migration, all new endpoints, `InvoiceArtifactService`, `FilesystemGeneratedArtifactStore`, `GeneratedArtifactRepositoryAdapter`, `InvoiceService.sendEmail` saved-vs-live change, `DELETE /api/v1/invoices/{id}`, three new error codes, `GeneratedArtifactProperties`, Docker volume, VBA macro rejection fix, all new frontend components and API layer, i18n keys, MSW handlers, and quality gate results.

### docs/API.md

- Endpoint summary table extended with 5 new rows (preview-pdf, generate, generated, generated/metadata, DELETE invoices/{id}).
- `POST /api/v1/invoices/{id}/send-email` — updated description noting saved-PDF preference since FEAT-20260514-02; updated error table noting LibreOffice error only applies during live-render fallback.
- New section **"Invoice Artifact Management (FEAT-20260514-02)"** with fully documented endpoint sections for:
  - `GET /api/v1/invoices/{id}/preview-pdf`
  - `POST /api/v1/invoices/{id}/generate` (with query params, request/response schemas, all error codes)
  - `GET /api/v1/invoices/{id}/generated` (with query params, streaming response)
  - `GET /api/v1/invoices/{id}/generated/metadata` (with `InvoiceArtifactsMetadataResponse` schema)
- `DELETE /api/v1/invoices/{id}` documented under the Invoices section.
- Error codes table extended with `GENERATED_ARTIFACT_NOT_FOUND` (404), `ARTIFACT_ALREADY_EXISTS` (409), `ARTIFACT_TOO_LARGE` (413); `INVALID_TEMPLATE_TYPE` description updated to include VBA macro case.

### docs/SEQUENCE_DIAGRAMS.md

- New section **"FEAT-20260514-02 — Invoice template editor and full lifecycle"** appended with three diagrams:
  - **4a** — Happy path: preview (live, no persist) → generate & save → download saved artefact.
  - **4b** — Send email with saved PDF: `InvoiceService` calls `artifactService.findPdfBytes`, skips renderer, sends saved bytes.
  - **4c** — Regenerate after template change: shows `overwrite=true` flow, badge update, explicit user action.

### postman/collection.json

- New folder **"Invoice Artifact Management (FEAT-20260514-02)"** added with 7 requests:
  - Preview Invoice PDF (GET /preview-pdf) — asserts `application/pdf`, `inline` disposition, `Cache-Control: private, no-store`.
  - Generate & Save PDF (POST /generate?format=PDF&overwrite=false) — asserts 201, `format`, `generatedAt`, `sizeBytes`, `sha256`.
  - Generate & Save DOCX (POST /generate?format=DOCX&overwrite=false).
  - Regenerate PDF (POST /generate?format=PDF&overwrite=true) — asserts 200 or 201, updated `generatedAt`.
  - Download Saved PDF (GET /generated?format=PDF) — asserts `application/pdf`, `attachment` disposition.
  - Download Saved DOCX (GET /generated?format=DOCX) — asserts DOCX content-type, `attachment` disposition.
  - Get Generated Artifacts Metadata (GET /generated/metadata) — asserts `pdf` and `docx` keys, validates non-null entries have expected fields.
- **"Delete Invoice"** request added to the **Invoices** folder (DELETE /{id}) — asserts 204 + empty body.

## Files not changed

- `docs/openapi.json` — backend was not started (Docker/Postgres unavailable in this run). The spec was not regenerated from `/v3/api-docs`. Hand-construction deferred: the authoritative human-readable API surface is fully documented in `docs/API.md` above. Regenerate once the backend is running: `cd projects/invoice-tracker/backend && JAVA_HOME=/c/Users/ExpertBook/.jdks/temurin-21.0.4 ./mvnw spring-boot:run`, then `curl -s http://localhost:8080/v3/api-docs | python3 -m json.tool > ../docs/openapi.json`.
- `postman/local-dev.environment.json` — no new environment variables required; `baseUrl`, `apiVersion`, `username`, `password`, `clientId`, `invoiceId` cover all new requests.
- `docs/SECURITY.md` — OWASP findings for this feature are summarised in `docs/FEATURES.md` under the FEAT-20260514-02 section. The security agent's full report is in `.features/FEAT-20260514-02/SECURITY.md`.
- `docs/DESIGN_SYSTEM.md` — no token or primitive changes.
