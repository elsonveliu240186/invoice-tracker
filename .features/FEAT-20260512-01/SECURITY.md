---
status: pass
auditor: claude-sonnet-4-6
generated_at: 2026-05-12T15:05:00Z
---

## Tools run

| Tool | Result | Notes |
|---|---|---|
| OWASP Dependency-Check (backend) | skipped | Frontend-only feature; no backend changes. Backend security posture unchanged from FEAT-20260511-01 which already passed. CI gate remains active. |
| pnpm audit (frontend) | pass | 0 High, 0 Critical. 2 Moderate findings only (esbuild GHSA-67mh-4wv8-2f99 CVSS 5.3 and vite GHSA-4w7w-66w2-5vf9 CVSS 0) — both affect the local dev server only, not the production bundle. Neither meets the High/Critical fail threshold. |
| Semgrep (--config=auto, 213 rules, 71 files) | pass | 0 findings, 0 blocking. Rules covered OWASP Top 10, TypeScript, React. |
| gitleaks | pass | 15 commits scanned, ~520 KB. No secrets found. .env file with NVD_API_KEY is gitignored and not tracked by git. |

## Moderate advisory detail (non-blocking)

### GHSA-67mh-4wv8-2f99 — esbuild CORS misconfiguration (CVSS 5.3)
- **Affects**: `esbuild@0.21.5` (transitive via `vite@5.4.21`)
- **Impact**: esbuild dev server sets `Access-Control-Allow-Origin: *`, allowing cross-origin reads of dev-server content from malicious pages. Only exploitable when `vite dev` is exposed to a network with `--host`.
- **Production risk**: None. esbuild is a build-time tool; the production bundle does not include it.
- **Recommendation**: Upgrade vite to `>=5.4.x` when a patch ships, or ensure `server.host` is not set in production deployments.

### GHSA-4w7w-66w2-5vf9 — Vite path traversal in `.map` handling (CVSS not yet scored)
- **Affects**: `vite@5.4.21`
- **Impact**: Dev server `.map` requests can traverse outside project root via `../` segments, bypassing `server.fs.strict`. Only exploitable when dev server is exposed with `--host` or `server.host`.
- **CVE**: CVE-2026-39365
- **Production risk**: None. Dev server is not used in production.
- **Recommendation**: Upgrade to vite `>=6.4.2` when the project migrates to Vite 6 (tracked separately). Until then, ensure the dev server is not exposed to untrusted networks (`server.host` is NOT set in `vite.config.ts` — confirmed).

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | n/a | Frontend-only. No new endpoints or auth surfaces. All API calls remain at `/api/v1/clients` via existing `http()` wrapper. |
| A02 | Cryptographic Failures | mitigated | `localStorage` stores only `it.theme` (theme preference) and `it.lang` (language code) — no credentials, tokens, or PII. No secrets committed (gitleaks clean, `.env` gitignored and untracked). |
| A03 | Injection (XSS / i18n) | mitigated | `dangerouslySetInnerHTML` — zero occurrences across all 47 `.tsx` files (Grep confirmed). `<Trans>` component — not used anywhere (Grep confirmed). `escapeValue: false` in i18n is intentional and correct: React automatically escapes all `{t()}` interpolations at the JSX level, so disabling i18next's secondary escape avoids double-encoding. All translation strings in `en.json` are static plain text with no HTML markup. No `eval()`, `document.write()`, or `innerHTML` usage detected. |
| A04 | Insecure Design | n/a | No auth flows, payments, OTP, or rate-limited surfaces added. |
| A05 | Security Misconfiguration | mitigated | CSP: unchanged from baseline (no inline scripts added, no `unsafe-inline` introduced). Inter font is bundled via `@fontsource/inter` — no third-party CDN calls, no privacy leakage. `vite.config.ts` does not set `server.host`, so dev server is not exposed to the network. `index.html` still has residual `bg-slate-50 text-slate-900` hard-coded on `<body>` (per PLAN.md this should have been removed) but this is a cosmetic non-security issue. No `management.endpoints` exposure (backend unchanged). |
| A06 | Vulnerable & Outdated Components | mitigated | pnpm audit: 0 High/Critical. All new Radix packages (`@radix-ui/react-avatar@1.1.11`, `react-dialog@1.1.15`, `react-dropdown-menu@2.1.16`, `react-separator@1.1.8`, `react-slot@1.2.4`) are current releases. `framer-motion@12.38.0`, `zustand@5.0.13`, `react-i18next@17.0.7`, `lucide-react@1.14.0`, `sonner@2.0.7` are all current. The 2 Moderate findings are dev-only (see above). |
| A07 | Identification & Authentication | n/a | No auth changes. No login, session, or JWT logic added. |
| A08 | Software & Data Integrity | mitigated | `pnpm-lock.yaml` is committed (tracked by git, verified with `git ls-files`). CI uses `pnpm install --frozen-lockfile` (ci.yml line 128). All new deps installed with integrity hashes in lockfile. No `postinstall` script bypass. |
| A09 | Security Logging & Monitoring | mitigated | `ErrorBoundary.componentDidCatch` logs to `console.error` only — no PII in the error object. No remote error sink in this feature. `en.json` translation strings contain no PII. |
| A10 | Server-Side Request Forgery | n/a | No user-supplied URLs forwarded. The `http()` wrapper calls fixed API paths only (`/api/v1/...`). Vite dev proxy target is `localhost:8080` (not user-configurable). |

## Required fixes

None. All tool results pass at the High/Critical threshold.

## Recommendations (non-blocking)

- [ ] Remove residual hard-coded `bg-slate-50 text-slate-900` from `<body>` in `frontend/index.html` (leftover from PLAN.md scope — cosmetic, no security impact, but noted in the plan as an intended change).
- [ ] Track vite upgrade to `>=6.4.2` in a future dependency-update ticket to resolve CVE-2026-39365 (Vite path traversal, dev-server-only, CVSS score pending). This is a follow-up for a separate maintenance feature.
- [ ] Consider adding a `Content-Security-Policy` meta tag to `index.html` (or via the hosting layer) in a future security hardening feature. Current absence is not introduced by this feature, but the design system foundation is an opportune time to plan it.
- [ ] `ClientForm.tsx` still has a few hard-coded English strings ("Save", "Cancel", "Saving…", "This email is already in use", "An unexpected error occurred") that should be migrated to `en.json` i18n keys. Not a security finding, but noted for consistency.
- [ ] `ConfirmDeleteDialog.tsx` has hard-coded "Delete client", "Cancel", "Delete" button labels — same i18n consistency note.
