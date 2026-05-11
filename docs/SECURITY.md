# Security log

Append-only record of security-auditor findings and their resolutions.

## Open findings

_(none)_

## History

| Date | Feature | Finding | Severity | Resolution | Reference |
|------|---------|---------|----------|------------|-----------|
| 2026-05-11 | FEAT-20260511-01 Client management | No required fixes. Two Moderate dev-only CVEs (esbuild GHSA-67mh-4wv8-2f99, vite GHSA-4w7w-66w2-5vf9) — dev server only, do not affect production build. | Low | Upgrade recommended before production (`pnpm update vite esbuild --latest`). Six non-blocking hardening recommendations logged (Semgrep/gitleaks in CI, env-var DB creds, auth rate limiting, CSP headers, backdrop-dismiss fix, MSW _idCounter reset). | [SECURITY.md](.features/FEAT-20260511-01/SECURITY.md) |

## OWASP Top 10 posture

The current implementation has been audited against OWASP Top 10 by the **security-auditor** agent on every feature. See `workflows/SECURITY_CHECKLIST.md` for the categories.
