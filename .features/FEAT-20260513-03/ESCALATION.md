---
escalated_at: 2026-05-14T02:12:00Z
feature_id: FEAT-20260513-03
reviewer: claude-sonnet
iteration: 3
reason: build-gate-failure-on-third-review
---

# ESCALATION — FEAT-20260513-03

## Why this is being escalated

This is the third and final review iteration (max 3 per loop rules). The Maven build gate has failed on all three iterations. Human intervention is required.

## Root Cause Analysis

### Iteration 3 failure

`./mvnw -Pfast verify` fails at the `process-classes` Maven phase with:

```
javax.xml.parsers.FactoryConfigurationError: Provider
  com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl
  could not be instantiated: java.lang.IllegalAccessException:
  class javax.xml.parsers.FactoryFinder cannot access class
  com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl
  (in module java.xml) because module java.xml does not export
  com.sun.org.apache.xerces.internal.jaxp to unnamed module
```

**Root cause:** `backend/pom.xml` lines 193-218 configure `exec-maven-plugin:3.3.0` to run `GenerateDefaultTemplate.main()` at the `process-classes` phase using the `exec:java` goal (in-process). The configuration includes:

```xml
<systemProperties>
  <systemProperty>
    <key>javax.xml.parsers.DocumentBuilderFactory</key>
    <value>com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl</value>
  </systemProperty>
</systemProperties>
```

This is intended to make Apache POI use the JDK's built-in XML parser. Under Java 21's module system this is non-functional: `com.sun.org.apache.xerces.internal.jaxp` is not exported by the `java.xml` module to unnamed modules. `Class.forName()` succeeds (the class is findable by name), but instantiation via the `FactoryFinder` path fails with `IllegalAccessException`. Apache POI's `XMLHelper.<clinit>` throws `FactoryConfigurationError`, `DocumentHelper` cannot initialise, and `XWPFDocument.write()` fails. The exec plugin propagates this as a `MojoExecutionException` and the build exits non-zero.

**Secondary impact:** `src/main/resources/templates/invoice-template.docx` does not exist in the repository. The file is only produced by this exec plugin step. Since the plugin has never succeeded, the classpath default template has never been generated. If the exec plugin were somehow bypassed, the `FilesystemInvoiceTemplateStore` classpath fallback would throw `FileNotFoundException` at runtime.

### Previous iteration failures

- **Iteration 1:** Dockerfile missing LibreOffice install; `useSendInvoice.ts` flat error toast; `PoiTlInvoiceDocxRenderer` missing `LoopRowTableRenderPolicy` binding.
- **Iteration 2:** `TemplateFixtures.minimalDocx()` raw OOXML ZIP leaving XMLBeans disconnected from CTDocument; `GenerateDefaultTemplate` placing `{{lines}}` in a plain paragraph (incompatible with `LoopRowTableRenderPolicy`). Build failed with 5 Surefire `XmlValueDisconnectedException` errors.
- **Iteration 3:** Iteration-2 source fixes are confirmed correct in source. New failure: exec-maven-plugin `<systemProperty>` workaround non-functional on Java 21; no template file in resources; build fails before tests run.

## Fix Options

### Option A — Pre-commit binary template (recommended, fastest unblock)

1. Run `GenerateDefaultTemplate.main()` locally with the JVM arg `--add-opens java.xml/com.sun.org.apache.xerces.internal.jaxp=ALL-UNNAMED` (set via `JAVA_TOOL_OPTIONS` or a wrapper script).
2. Commit the resulting `backend/src/main/resources/templates/invoice-template.docx` (~10 KB) as a static repository asset.
3. Remove the `generate-default-template` exec-plugin execution from `pom.xml` entirely.
4. Keep `GenerateDefaultTemplate.java` as a developer utility only (not bound to any Maven phase).

**Advantage:** Zero Maven complexity at build time; template is a stable committed artifact.

### Option B — Fix exec plugin to fork a JVM (keeps dynamic generation)

Replace `exec:java` (in-process) with `exec:exec` (forked JVM), which starts a new JVM process and allows `--add-opens` as a JVM argument:

```xml
<goal>exec</goal>
<configuration>
  <executable>${java.home}/bin/java</executable>
  <arguments>
    <argument>--add-opens</argument>
    <argument>java.xml/com.sun.org.apache.xerces.internal.jaxp=ALL-UNNAMED</argument>
    <argument>-classpath</argument>
    <classpath/>
    <argument>com.example.invoicetracker.tools.GenerateDefaultTemplate</argument>
    <argument>${project.build.outputDirectory}/templates/invoice-template.docx</argument>
  </arguments>
</configuration>
```

**Advantage:** Template regenerates from source on every build (useful if the template structure changes during development).

## Required Human Action

1. Choose Option A or B above and apply the fix.
2. Verify `./mvnw -Pfast verify` exits 0 locally.
3. Trigger a 4th review iteration (requires explicit override of the max-3 rule):
   - Run `/run-review invoice-tracker FEAT-20260513-03` to re-enter the loop.
   - Alternatively, if satisfied that all source fixes are correct, manually advance STATE.json to `SecurityScan` and run `/run-security invoice-tracker FEAT-20260513-03`.
