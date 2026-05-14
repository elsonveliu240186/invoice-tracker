---
status: fail
auditor: claude-sonnet-4-6
generated_at: 2026-05-14T23:36:00Z
iteration: 3
---

## Summary

Iteration 3 security scan. The primary remediation target CVE-2024-47554 (commons-io 2.11.0, CVSS 8.7 High via poi-tl to poi-ooxml) is confirmed resolved: Grype scanned the freshly rebuilt JAR (invoice-tracker-0.0.1-SNAPSHOT.jar) and found zero HIGH or CRITICAL findings. gitleaks and pnpm audit both pass. One Semgrep blocking finding is present in pre-existing backend code (LibreOfficePdfConverter.java:69); it is a definitively confirmed false positive that requires a nosemgrep suppression annotation before the gate can pass.

## Tools run

| Tool | Result | Notes |
|---|---|---|
| gitleaks | pass | 27 commits scanned (~1.22 MB). 0 secrets found. |
| Trivy (filesystem) | not_run | Not in scope for iteration 3; passed in iteration 1 (exit 0, no HIGH/CRITICAL). |
| Grype (file:/JAR) | pass | Scanned backend/target/invoice-tracker-0.0.1-SNAPSHOT.jar (freshly built). Exit 0. CVE-2024-47554 absent -- commons-io 2.17.0 confirmed. Medium-only findings (see detail below). |
| OWASP Dependency-Check | not_run | Not in scope for iteration 3; prior scans passed with suppressions in backend/owasp-suppressions.xml. |
| pnpm audit | pass | 674 deps. 0 high, 0 critical. 2 moderate (non-blocking, dev-server only): GHSA-67mh-4wv8-2f99 esbuild CVSS 5.3, GHSA-4w7w-66w2-5vf9 vite CVE-2026-39365. Same findings as iteration 1. |
| Semgrep | fail | 1 blocking finding: java.lang.security.audit.command-injection-process-builder in LibreOfficePdfConverter.java:69. Pre-existing backend file not touched by this frontend-only feature. Confirmed false positive -- see Required Fixes. |

## Grype JAR scan detail (freshly built JAR, exit 0)

    NAME              INSTALLED  FIXED IN  TYPE          VULNERABILITY        SEVERITY
    poi-ooxml         5.2.2      5.4.0     java-archive  GHSA-gmg8-593g-7mv3  Medium
    commons-compress  1.21       1.26.0    java-archive  GHSA-4265-ccf5-phj5  Medium
    commons-compress  1.21       1.26.0    java-archive  GHSA-4g9r-vxhx-9pgx  Medium

CVE-2024-47554 / GHSA-78wr-2p64-hpwj (commons-io, CVSS 8.7): absent -- fix confirmed. commons-io 2.17.0 is the version embedded in the deployed artifact.

## OWASP Top 10 cross-check

| # | Category | Status | Evidence |
|---|---|---|---|
| A01 | Broken Access Control | n/a | Frontend-only feature (design tokens, layout, icon visibility). No new endpoints, no object ID traversal, no authorization changes. |
| A02 | Cryptographic Failures | n/a | No crypto changes. No secrets introduced (gitleaks pass, 0 findings). |
| A03 | Injection | mitigated | No dangerouslySetInnerHTML in any .tsx file. No eval() or raw innerHTML. All user input goes through React controlled components. |
| A04 | Insecure Design | n/a | No new rate-limited surfaces, no payment flows, no OTP changes introduced by this feature. |
| A05 | Security Misconfiguration | mitigated | Actuator exposure confirmed as health,info only (application.yml). nginx.conf serves SPA correctly. CSP header not yet set (pre-existing gap, noted as recommendation). |
| A06 | Vulnerable and Outdated Components | mitigated | CVE-2024-47554 remediated: commons-io pinned to 2.17.0 in pom.xml dependencyManagement; Grype JAR scan exit 0 confirms fix. pnpm audit 0 high/critical. |
| A07 | Identification and Authentication | n/a | No auth flow changes in this feature. |
| A08 | Software and Data Integrity | mitigated | pom.xml dependencyManagement pins commons-io:2.17.0. pnpm-lock.yaml committed. No new packages added by this feature. |
| A09 | Security Logging and Monitoring | n/a | No logging changes. Existing SLF4J patterns confirmed in prior audits. |
| A10 | Server-Side Request Forgery | n/a | No external HTTP calls introduced. No user-supplied URLs forwarded. |

## Semgrep false positive analysis

Rule: java.lang.security.audit.command-injection-process-builder
Location: backend/src/main/java/com/example/invoicetracker/application/invoice/LibreOfficePdfConverter.java line 69
Code: new ProcessBuilder(cmd.toList())

Why this is a false positive:

1. cmd is a LibreOfficePdfCommand value object. Its constructor arguments are: soBinary (from @Value("${app.libreoffice.binary:soffice}") -- a server-side configuration property set at deployment time by ops, not by end users); loProfileDir (a JVM-generated Files.createTempDirectory() path); outDir (the same temp directory); inputFile (fixed filename in.docx inside the temp directory). No user-supplied string flows into any of these arguments.

2. ProcessBuilder receives a List<String>, not a shell command string. It does not invoke a shell. Shell metacharacters in list elements cannot cause injection because each element is passed as a separate argv entry directly to the OS exec call.

3. The Semgrep rule fires because cmd.toList() is not a compile-time literal. This is a known limitation of the rule for list-form ProcessBuilder usage.

Required action: Add a nosemgrep annotation with inline explanation on line 69 of LibreOfficePdfConverter.java per the project suppression policy (workflows/SECURITY_CHECKLIST.md).

## Required fixes

- [ ] Add nosemgrep suppression annotation to LibreOfficePdfConverter.java line 69. The annotation must include an inline explanation per suppression policy. Add the following comment block immediately before the ProcessBuilder call (line 69):

      // nosemgrep: java.lang.security.audit.command-injection-process-builder
      // False positive: all ProcessBuilder args are server-controlled. soBinary comes from
      // @Value app property (set by ops, not user input). loProfileDir/outDir/inputFile are
      // JVM-generated temp Path objects with fixed filenames. List-form ProcessBuilder
      // never invokes a shell, so shell metacharacter injection is not possible.

## Recommendations (non-blocking)

- [ ] Add Content-Security-Policy header to frontend/nginx.conf (pre-existing gap, A05). A restrictive CSP prevents XSS escalation even if a future injection vulnerability is introduced. Noted in prior scan iterations and still unaddressed.
- [ ] Upgrade poi-ooxml from 5.2.2 to 5.4.0 to resolve GHSA-gmg8-593g-7mv3 (Medium). No urgent timeline, but reduces Grype noise in future scans.
- [ ] Upgrade commons-compress from 1.21 to 1.26.0 to resolve GHSA-4265-ccf5-phj5 and GHSA-4g9r-vxhx-9pgx (both Medium). Can be forced via dependencyManagement as was done for commons-io.
- [ ] Upgrade esbuild to >=0.25.0 (GHSA-67mh-4wv8-2f99) and vite to >=6.4.2 (GHSA-4w7w-66w2-5vf9) in the next routine dependency update cycle. Both are dev-server-only issues with zero production impact.
- [ ] Add a .grype.yaml at project root to suppress stdlib go1.20.12 false positives when running Grype in full dir: mode against the source tree (these arise from a vendored Go example file inside the flatted npm package; the JAR scan does not produce this noise).
