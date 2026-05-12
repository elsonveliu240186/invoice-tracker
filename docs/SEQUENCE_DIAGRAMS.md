# Sequence diagrams

Append-only. The documentation subagent adds a new `###` section per feature with the diagram copied from its PLAN.md.

## Conventions

- One section per **feature id**: `### FEAT-YYYYMMDD-NN — <title>`.
- Show actors with `actor`, components with `participant`.
- Include error paths when non-trivial.

---

### FEAT-20260511-01 — Client management (CRUD)

#### Happy path — create client

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React (ClientForm)
    participant API as ClientController
    participant SVC as ClientService
    participant REPO as ClientRepository
    participant DB as Postgres

    U->>FE: fills form, clicks Save
    FE->>API: POST /api/v1/clients {name,email,phone?,address?}
    API->>API: @Valid CreateClientRequest
    API->>SVC: create(cmd)
    SVC->>REPO: existsByEmailIgnoreCaseAndDeletedAtIsNull(email)
    REPO->>DB: SELECT 1 ...
    DB-->>REPO: false
    SVC->>REPO: save(entity)
    REPO->>DB: INSERT
    DB-->>REPO: row + generated id
    REPO-->>SVC: ClientEntity
    SVC-->>API: ClientResponse
    API-->>FE: 201 Created + body
    FE-->>U: toast "Client created", redirect to list
```

#### Error path — duplicate email (409)

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React
    participant API as ClientController
    participant SVC as ClientService
    participant REPO as ClientRepository

    U->>FE: submit duplicate email
    FE->>API: POST /api/v1/clients
    API->>SVC: create(cmd)
    SVC->>REPO: existsByEmailIgnoreCaseAndDeletedAtIsNull
    REPO-->>SVC: true
    SVC--xAPI: throw ClientEmailTakenException
    API-->>FE: 409 problem+json { code:"CLIENT_EMAIL_TAKEN" }
    FE-->>U: inline field error on email
```

---

### FEAT-20260512-01 — Frontend design system foundation

#### Happy path — theme toggle and i18n hydration on app boot

```mermaid
sequenceDiagram
    actor U as User
    participant HTML as index.html
    participant Main as main.tsx
    participant I18n as i18n init
    participant TS as useThemeStore
    participant Doc as <html> classList
    participant TT as ThemeToggle

    HTML->>Main: load bundle
    Main->>I18n: i18n.init(en)
    I18n-->>Main: ready
    Main->>TS: hydrate from localStorage("it.theme")
    TS->>Doc: add/remove "dark" class based on persisted or system pref
    Main-->>U: render AppShell (themed, translated)
    U->>TT: click toggle
    TT->>TS: setTheme(next)
    TS->>localStorage: write "it.theme"
    TS->>Doc: toggle "dark" class
    Doc-->>U: instant repaint
```

#### Edge case — OS colour-scheme changes while in system mode

```mermaid
sequenceDiagram
    participant OS as OS
    participant MM as matchMedia(prefers-color-scheme)
    participant TS as useThemeStore
    participant Doc as <html> classList
    OS->>MM: scheme changed -> dark
    MM-->>TS: change event (only fired when mode === 'system')
    TS->>Doc: add "dark" class
```
