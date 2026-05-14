# ESCALATION — FEAT-20260513-02

**Feature:** Invoice Export -- PDF generation & email delivery to clients
**Escalated at:** 2026-05-14T00:58:00Z
**Reason:** Review gate failed on iteration 3 (the maximum). Three iterations of developer fixes have not produced a passing build. Human intervention required.

## What was attempted

- Iteration 1 fix: Added smtp-failure E2E spec; attempted AC-5 clientEmail fix (incomplete).
- Iteration 2 fix: Added clientEmail to InvoiceResponse; fixed 4 test files with wrong Invoice constructor arity; added 502 IT test to InvoiceControllerIT.
- Iteration 3 fix (reported green by developer): Build reported as 146 tests, 0 failures.

## Why iteration 3 still fails

The developer reported a passing build, but the build was using stale cached .class files from a prior compilation. A fresh `./mvnw -Pfast verify` run reveals three runtime failures that prevent the IT suite from passing.

### Blocking finding 1 -- InvoiceControllerIT ApplicationContext failure (all 6 tests)

**File:** backend/src/test/java/com/example/invoicetracker/adapter/web/invoice/InvoiceControllerIT.java:50-55

**Error:**
```
Caused by: org.springframework.boot.context.properties.bind.BindException:
  Failed to bind properties under 'spring.mail.port' to java.lang.Integer
Caused by: java.lang.NullPointerException:
  Cannot invoke "com.icegreen.greenmail.util.GreenMail.getSmtp()"
  because the return value of "com.icegreen.greenmail.util.GreenMailProxy.getGreenMail()" is null
```

**Root cause:** The @DynamicPropertySource method calls `greenMail.getSmtp().getPort()` to get the ephemeral SMTP port. However, Spring calls @DynamicPropertySource callbacks during the ApplicationContext initialisation phase, which happens *before* JUnit 5 extension lifecycle callbacks (specifically `beforeAll`). GreenMailExtension uses a GreenMailProxy whose inner GreenMail instance is only created and started in `beforeAll`. When Spring calls the @DynamicPropertySource callback, GreenMailProxy.getGreenMail() returns null, causing an NPE when getSmtp() is chained.

**Required fix:** Either (a) add a `@BeforeAll static void startGreenMail() { greenMail.start(); }` method in InvoiceControllerIT, which forces GreenMail to start before Spring's property-source resolution; or (b) use a fixed SMTP port (e.g. 3025) stored in a constant, and pass that constant to both the ServerSetup constructor and the @DynamicPropertySource, eliminating the need for `getSmtp().getPort()`.

### Blocking finding 2 -- InvoiceRepositoryAdapterIT.find_returns_empty_for_deleted_invoice

**File:** backend/src/main/java/com/example/invoicetracker/adapter/persistence/invoice/InvoiceEntityMapper.java:73-85

**Error:**
```
org.hibernate.NonUniqueObjectException: A different object with the same identifier value
  was already associated with this persistence context for entity
  [InvoiceLineEntity with id 'de91b67f-...']
```

**Root cause:** `updateEntity` clears the lines collection via `entity.getLines().clear()` (line 81), which schedules the child `InvoiceLineEntity` rows for orphan deletion. It then adds new `InvoiceLineEntity` instances at line 83 with the same UUID values (sourced from the domain `InvoiceLine` record). Within the same Hibernate persistence context, both the ghost (scheduled-for-delete) entity and the newly added entity have identical identifiers, violating Hibernate's identity map constraint.

**Required fix:** Either (a) generate fresh UUIDs for all replacement InvoiceLineEntity instances (breaking the re-use of the same UUID from the domain record), or (b) instead of clearing and re-adding, update existing managed InvoiceLineEntity objects in-place (merge by UUID).

### Blocking finding 3 -- InvoiceRepositoryAdapterIT.findAll_with_client_filter_returns_matching_invoices

**File:** backend/src/main/java/com/example/invoicetracker/adapter/persistence/invoice/InvoiceJpaRepository.java:28-34

**Error:**
```
org.hibernate.LazyInitializationException: Cannot lazily initialize collection of role
  'InvoiceEntity.lines' (no session)
```

**Root cause:** `findAllActive` has no `@EntityGraph`, so the `lines` collection is LAZY. When `InvoiceRepositoryAdapter.findAll` calls `jpaRepository.findAllActive(...).map(mapper::toDomain)`, Spring Data closes the Hibernate session after the query completes. The subsequent `.map(mapper::toDomain)` call accesses `entity.getLines()` outside any Hibernate session, triggering a LazyInitializationException.

**Required fix:** Add `@EntityGraph(attributePaths = "lines")` on the `findAllActive` method in InvoiceJpaRepository. This matches the existing pattern on `findByIdWithLinesAndNotDeleted`.

### Blocking finding 4 -- JaCoCo branch coverage 72% (gate 90%)

The IT-layer tests are the primary contributors to branch coverage on InvoiceController, InvoiceService, and InvoiceRepositoryAdapter. Because all IT tests fail (findings 1-3), the merged jacoco-merged.exec records 72% branch coverage against the 90% gate. This will resolve automatically once findings 1-3 are fixed.

## Recommended actions for the developer

1. Fix InvoiceControllerIT: add `@BeforeAll static void startGreenMail() { greenMail.start(); }` immediately above the @DynamicPropertySource method. Annotate with `@TestMethodOrder(MethodOrderer.OrderAnnotation.class)` if needed to keep test order deterministic after GreenMail restart in the 502 test.

2. Fix InvoiceEntityMapper.updateEntity: replace the UUID-reuse pattern with fresh-UUID generation for line entities OR update existing managed line entities in-place. The safest fix is to change `lineToEntity` to always generate `UUID.randomUUID()` for the line entity id, and accept that line UUIDs are persistence-internal identifiers (the domain InvoiceLine.id would remain unchanged in domain logic but differ from the persisted row id -- requiring a separate column for the domain key if that separation matters).

3. Fix InvoiceJpaRepository.findAllActive: add `@EntityGraph(attributePaths = "lines")` annotation.

4. Re-run `./mvnw -Pfast verify` from a *clean* build (not from cached .class files) to confirm all tests pass before marking the build as green.

## Pre-existing issues (not blocking this feature but should be tracked)

- frontend/src/pages/RegisterPage.test.tsx and frontend/src/features/clients/ui/ClientsPage.test.tsx both time out at 5 s. These are not caused by FEAT-20260513-02 but should be fixed in a separate ticket.
