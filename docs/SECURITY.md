# Security log

Append-only record of security-auditor findings and their resolutions.

## Open findings

_(none)_

## History

| Date | Feature | Finding | Severity | Resolution | Reference |
|------|---------|---------|----------|------------|-----------|
| 2026-05-12 | FEAT-20260512-01 Frontend design system | No required fixes. Two Moderate dev-only CVEs carried from FEAT-20260511-01: esbuild GHSA-67mh-4wv8-2f99 (CVSS 5.3, dev-server CORS) and vite GHSA-4w7w-66w2-5vf9 / CVE-2026-39365 (dev-server path traversal). Semgrep 0 findings, gitleaks 0 secrets, `pnpm audit` 0 high/critical. Four non-blocking recommendations: remove residual `bg-slate-50 text-slate-900` from `index.html`; track vite `>=6.4.2` upgrade for CVE-2026-39365; add `Content-Security-Policy` meta tag in a security-hardening feature; migrate hard-coded English strings in `ClientForm.tsx` and `ConfirmDeleteDialog.tsx` to `en.json`. | Low | No production risk. Upgrade `vite`/`esbuild` before production deployment. CSP and full i18n consistency tracked as future features. | [SECURITY.md](.features/FEAT-20260512-01/SECURITY.md) |
| 2026-05-11 | FEAT-20260511-01 Client management | No required fixes. Two Moderate dev-only CVEs (esbuild GHSA-67mh-4wv8-2f99, vite GHSA-4w7w-66w2-5vf9) — dev server only, do not affect production build. | Low | Upgrade recommended before production (`pnpm update vite esbuild --latest`). Six non-blocking hardening recommendations logged (Semgrep/gitleaks in CI, env-var DB creds, auth rate limiting, CSP headers, backdrop-dismiss fix, MSW _idCounter reset). | [SECURITY.md](.features/FEAT-20260511-01/SECURITY.md) |

## OWASP Top 10 posture

The current implementation has been audited against OWASP Top 10 by the **security-auditor** agent on every feature. See `workflows/SECURITY_CHECKLIST.md` for the categories.
