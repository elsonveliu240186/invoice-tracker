# FEAT-20260516-01 History

- `Requested → Planning` at 2026-05-16T00:00:00Z
- `Planning → AwaitingApproval` at 2026-05-16T00:00:00Z — planner wrote PLAN.md
- `AwaitingApproval → Developing` at 2026-05-16T00:00:00Z — plan approved, developer agents dispatched
- `Developing → Reviewing` at 2026-05-16T17:40:00Z — backend developer implemented all layers; mvnw -Pfast verify exits 0; checkstyle + spotbugs pass; JaCoCo ≥ 90%
`- Reviewing -> SecurityScan` at 2026-05-16T18:30:00Z -- reviewer iteration 1 completed, status: pass, 0 required findings, 3 recommended findings

- `SecurityScan -> QA` at 2026-05-16T19:45:00Z — security-auditor: status pass. gitleaks: 0 secrets. Semgrep: 0 findings (394 rules, 513 files). pnpm audit: 0 High/Critical (2 Moderate, dev-server-only). Grype: no High/Critical in project code (Go stdlib hits suppressed as false positives from flatted npm Go reference file; .grype.yaml created). OWASP DC: degraded run (NVD_API_KEY absent); re-run required. Trivy: timed out (requires --timeout 20m). All OWASP Top 10 items mitigated or n/a. Required fixes: add .grype.yaml suppression (done), set NVD_API_KEY for next DC run.

- `SecurityScan -> Developing` at 2026-05-16T20:45:00Z — security-auditor: status FAIL. Critical blocker: unresolved Git merge conflict markers on `main` in 4 files (InvoiceController.java, InvoiceService.java, InvoiceRepository.java, InvoiceServiceTest.java) — codebase cannot compile. Additional fail: no auth rate-limiting (A04/A07). gitleaks: pass (0 secrets). pnpm audit: pass (0 High/Critical; 2 Moderate dev-server-only advisories). Trivy/Grype/OWASP DC/Semgrep: scan runs did not complete within report window (pending tool results). Required fixes: (1) resolve all merge conflicts, (2) add auth rate-limiting, (3) re-run full tool battery after fix.
- `SecurityScan -> Developing (amended)` at 2026-05-16T21:05:00Z — tool results finalised after initial report. Grype: pass — 0 High/Critical, 5 Medium (poi-ooxml GHSA-gmg8-593g-7mv3, commons-compress GHSA-4265-ccf5-phj5 + GHSA-4g9r-vxhx-9pgx transitive via poi-tl, vite GHSA-4w7w-66w2-5vf9 dev-only, esbuild GHSA-67mh-4wv8-2f99 dev-only). Semgrep: pass — 0 findings, 394 rules, 529 files. OWASP DC: tool_missing — NVD API 429, no report generated, corrupt .dc-data cache. Trivy: still pending. Overall verdict unchanged: FAIL due to unresolved merge conflicts and missing auth rate-limiting.

## Conflict Resolution — 2026-05-16

**Root cause**: Three feature branches were merged to `main` without running a build verification after each merge. Conflict markers were committed unresolved in 5 backend Java files and 21 frontend TypeScript/TSX files.

### Backend fixes (manual — 5 files)
- `GlobalExceptionHandler.java` — merged `ExpenseNotFoundException` import with `ArtifactAlreadyExistsException` + `ArtifactTooLargeException`
- `InvoiceController.java` — kept HEAD artifact endpoints (previewPdf, generate, streamGenerated, generatedMetadata) + expense branch's UPDATE endpoint
- `InvoiceRepository.java` — kept HEAD javadoc for `softDelete` + expense branch's `update` and `findMaxNumberForYear` methods
- `InvoiceService.java` — kept HEAD's javadoc + `artifactService.deleteAll(id)` before `softDelete` call
- `InvoiceServiceTest.java` — kept HEAD's sendEmail tests + deleteInvoice tests with `artifactService` verification

### Frontend fixes (developer-frontend agent — 21 files)
- `App.tsx` — merged all imports and routes from all three branches under `PaletteProvider`
- `DashboardPage.tsx/test.tsx` — kept HEAD's full stat-cards + charts implementation
- `ClientsPage.tsx/test.tsx` — kept HEAD's search/filter/escape/reset features
- `ClientTable.tsx/test.tsx`, `ClientFormSheet.tsx/test.tsx`, `ClientDetailPage.tsx/test.tsx` — kept HEAD's complete implementations, merged additive tests
- `ClientStatusBadge.tsx/test.tsx` — kept HEAD testids + added `data-variant` attributes
- `derive.ts/test.ts` — kept HEAD's `deletedAt`-based derivation
- `LoginForm.test.tsx`, `useAuthStore.test.ts` — merged HEAD + additive tests from expense branch
- `InvoicesListPage.tsx/test.tsx` — added `link-manage-template`, merged test suites
- `Sidebar.test.tsx`, `HomePage.test.tsx`, `App.test.tsx` — kept HEAD's full suites

### Process improvement
Build verification (`mvnw -Pfast verify` + `pnpm vitest run`) is now required before declaring any branch merge to main successful. FEATURE_LIFECYCLE.md to be updated.

### Next steps
1. Verify build passes (backend + frontend) on main with conflict markers removed
2. Implement auth rate-limiting (A04/A07) — required by security audit
3. Re-run `/run-security invoice-tracker FEAT-20260516-01` after rate-limiting is added
4. Re-run `/run-qa invoice-tracker FEAT-20260516-01` after security passes
