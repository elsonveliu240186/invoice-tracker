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
