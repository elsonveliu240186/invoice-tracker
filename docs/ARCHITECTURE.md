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

```mermaid
flowchart LR
    main[main.tsx] --> router[BrowserRouter]
    router --> pages[pages/*]
    pages --> features["features/<name>/{ui,model,api}"]
    features --> shared["shared/{ui,lib,api}"]
```

## Decisions log

### ADR-000 — Scaffolded with agenticai

- **Date**: 2026-05-11
- **Decision**: Use Spring Boot 4.0.6 backend (Maven, Java 21) + Vite/React/Tailwind v4 frontend, per the framework default.
- **Why**: latest stable LTS combo; agentic toolchain optimised for these.
- **Trade-offs**: locks into JVM + Node toolchains; mitigations not needed at this stage.
