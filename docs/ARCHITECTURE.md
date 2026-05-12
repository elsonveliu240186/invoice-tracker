# Architecture

Maintained by the **documentation** subagent. Edit by hand only when refactoring beyond what a single feature does.

## System context (C4 — level 1)

```mermaid
C4Context
    title System context — invoice-tracker
    Person(user, "User", "End user of the app")
    System(app, "invoice-tracker", "Web application")
    System_Ext(idp, "Identity Provider", "OAuth/OIDC")
    Rel(user, app, "uses", "HTTPS")
    Rel(app, idp, "authenticates", "OIDC")
```

## Containers (C4 — level 2)

```mermaid
C4Container
    title Containers — invoice-tracker
    Person(user, "User")
    System_Boundary(s, "invoice-tracker") {
        Container(fe, "Frontend", "React + Vite + Tailwind", "SPA")
        Container(be, "Backend", "Spring Boot 4.0", "REST API")
        ContainerDb(db, "Database", "Postgres 16", "Application data")
    }
    Rel(user, fe, "uses", "HTTPS")
    Rel(fe, be, "calls", "JSON/HTTPS")
    Rel(be, db, "reads/writes", "JDBC")
```

## Components — Backend (C4 — level 3)

```mermaid
flowchart TB
    subgraph adapter_web["adapter.web"]
        ctl[Controllers]
    end
    subgraph application["application"]
        svc[Services / Use-cases]
    end
    subgraph domain["domain"]
        entities[Entities, Value Objects]
        repos[Repository interfaces]
    end
    subgraph adapter_persistence["adapter.persistence"]
        jpa[JPA implementations]
    end
    ctl --> svc
    svc --> entities
    svc --> repos
    repos -.implemented by.-> jpa
```

## Components — Frontend

Updated by FEAT-20260512-01 (design system foundation).

```mermaid
flowchart LR
    subgraph Browser
      idx[index.html] --> main[main.tsx]
      main --> providers[Providers: I18n + Theme + ErrorBoundary + Router]
      providers --> shell[AppShell]
      shell --> sidebar[Sidebar]
      shell --> topnav[TopNav]
      topnav --> tt[ThemeToggle]
      topnav --> ls[LanguageSelector]
      shell --> page[PageContainer<br/>Framer Motion]
      page --> home[HomePage]
      page --> clients[ClientsPage]
    end
    subgraph SharedUI[src/shared/ui]
      btn[Button] --- inp[Input] --- card[Card] --- badge[Badge]
      dlg[Dialog] --- tbl[Table] --- skl[Skeleton] --- son[Sonner]
      dd[DropdownMenu] --- av[Avatar] --- sep[Separator]
    end
    subgraph SharedLib[src/shared/lib]
      i18n[i18n.ts] --- motion[motion.ts] --- cn[cn.ts]
    end
    subgraph SharedTheme[src/shared/theme]
      store[useThemeStore] --- provider[ThemeProvider]
    end
    page --> SharedUI
    providers --> SharedTheme
    providers --> SharedLib
```

## Decisions log

### ADR-000 — Scaffolded with agenticai

- **Date**: 2026-05-11
- **Decision**: Use Spring Boot 3.5.3 backend (Maven, Java 21) + Vite/React/Tailwind v4 frontend, per the framework default.
- **Why**: Spring Boot 3.5.3 is the current stable release. Boot 4.x removed `@WebMvcTest` / `@DataJpaTest` from `spring-boot-test-autoconfigure`, making slice-test strategies impossible without significant rework. 3.5.3 is used until Boot 4 stabilises the test infrastructure.
- **Trade-offs**: locks into JVM + Node toolchains; mitigations not needed at this stage.

### ADR-001 — FEAT-20260511-01: Soft-delete pattern for clients

- **Date**: 2026-05-11
- **Decision**: Clients are never hard-deleted. A `deleted_at TIMESTAMPTZ` column is set by the service; all repository queries carry an explicit `deleted_at IS NULL` predicate.
- **Why**: Invoices will reference clients by UUID. Hard-deleting a client would orphan existing invoices. Soft-delete preserves referential integrity and allows recovery. Using explicit predicates (not Hibernate `@SQLDelete`/`@Where`) keeps query intent visible in JPQL.
- **Trade-offs**: Deleted rows accumulate; periodic archival or purge job will be needed at scale. Unique-email constraint requires the partial index workaround (see ADR-002).

### ADR-002 — FEAT-20260511-01: Partial unique index on email for active clients

- **Date**: 2026-05-11
- **Decision**: Email uniqueness is enforced by a Postgres partial unique index `ux_clients_email_active ON clients (lower(email)) WHERE deleted_at IS NULL` rather than a plain `UNIQUE` constraint.
- **Why**: A plain unique constraint would block re-registration of an email belonging to a soft-deleted client, which is undesirable. The partial index only enforces uniqueness among active (non-deleted) rows.
- **Trade-offs**: Non-standard Postgres feature; not portable to all databases. H2 (used in `test` Spring profile) does not enforce partial unique indexes, so the uniqueness guard is validated by the application layer in the service and by Testcontainers integration tests only.

### ADR-003 — FEAT-20260511-01: Pagination size capped at 100

- **Date**: 2026-05-11
- **Decision**: `ClientService.list()` clamps the requested `size` to the range `[1, 100]` server-side before passing to the repository.
- **Why**: An unbounded `size` parameter is a denial-of-service vector; a client could request millions of rows in a single call. The cap is enforced in code (not just OpenAPI documentation) so it cannot be bypassed by crafted requests.
- **Trade-offs**: Bulk-export use cases require multiple paginated calls; acceptable at this scale.

### ADR-004 — FEAT-20260511-01: CSRF disabled for `/api/v1/**`

- **Date**: 2026-05-11
- **Decision**: `SecurityConfig` disables Spring Security CSRF protection for all `/api/v1/**` paths.
- **Why**: The SPA authenticates with HTTP Basic (stateless); there are no session cookies that an attacker could hijack via cross-site form submission. CSRF protection is meaningful only for cookie-based sessions.
- **Trade-offs**: If authentication is upgraded to OIDC/session cookies in a future feature, CSRF must be re-enabled or replaced with the `SameSite=Strict` cookie attribute. This is tracked as a migration item in the auth-upgrade feature.

### ADR-005 — FEAT-20260511-01: Spring Boot 3.5.3 pinned over 4.x

- **Date**: 2026-05-11
- **Decision**: `pom.xml` pins `spring-boot.version` to `3.5.3`. References to `4.0.6` in earlier scaffolding have been corrected.
- **Why**: Spring Boot 4.0 dropped `@WebMvcTest` and `@DataJpaTest` slice-test support. The project uses 13 `@WebMvcTest` and `@DataJpaTest` test classes; migrating to Boot 4 would require restructuring the entire test pyramid. Boot 3.5.3 is the current stable LTS release and fully supports Java 21.
- **Trade-offs**: Will require a planned migration to Boot 4 once slice-test support stabilises upstream.

### ADR-006 — FEAT-20260512-01: Shadcn/ui primitives vendored under src/shared/ui/

- **Date**: 2026-05-12
- **Decision**: shadcn/ui components are hand-vendored into `src/shared/ui/` rather than runtime-loaded. The CLI's `components.json` config targets the same directory for future `shadcn add` runs.
- **Why**: Vendoring keeps the component source editable, removes a runtime network dependency, and avoids a CDN privacy leak. Tailwind v4's CSS-first mode (no `tailwind.config.ts`) requires a small hand-migration for components generated by older shadcn CLI templates.
- **Trade-offs**: Updates to upstream shadcn components require manual re-vendoring. CI does not automatically detect drift. Vendored files are excluded from Vitest coverage to avoid inflating the metric with boilerplate Radix wrappers.

### ADR-007 — FEAT-20260512-01: Zustand for theme state; no React context

- **Date**: 2026-05-12
- **Decision**: Theme state (`light | dark | system`) is managed by a Zustand store (`useThemeStore`) with the `persist` middleware writing to `localStorage` key `it.theme`. A thin `ThemeProvider` component handles the `matchMedia` side-effect and `document.documentElement.classList` updates; no React context is used.
- **Why**: Zustand's module-level subscribe/getState API lets the theme apply before the first paint without a context provider wrapping the entire tree. The `persist` middleware handles serialisation and rehydration with one line of config.
- **Trade-offs**: Theme state is global singleton state; tests must reset `localStorage` and the Zustand store between runs (`vi.stubGlobal`, `useThemeStore.setState`).

### ADR-008 — FEAT-20260512-01: Dual toast system during transition (sonner + legacy)

- **Date**: 2026-05-12
- **Decision**: Both the legacy `ToastProvider`/`useToast` system and the new `sonner` `<Toaster />` are mounted simultaneously in `App.tsx` during this feature. Existing callers of `useToast` are not migrated. New components (design system primitives) use sonner. The legacy `Toast.tsx` is marked `// @deprecated`.
- **Why**: Migrating all `useToast` callers in the same PR would expand the change set and risk introducing regressions in existing client tests. Isolating the migration to FEAT-20260512-03 keeps the blast radius bounded.
- **Trade-offs**: Two toast systems run in parallel until FEAT-20260512-03 ships. Mounting both is cosmetically harmless (only one is visible at a time given the current call sites).
