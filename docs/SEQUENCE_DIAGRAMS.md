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

---

### FEAT-20260512-02 — Authentication modernization

#### 4a — Email/password login (happy path)

```mermaid
sequenceDiagram
    actor U as User
    participant FE as React (LoginPage)
    participant Z as useAuthStore
    participant BE as AuthController
    participant DB as users table
    U->>FE: submit { email, password }
    FE->>FE: zod validate (loginSchema)
    FE->>BE: POST /api/v1/auth/login (Basic email:password)
    BE->>DB: select where email = ?
    DB-->>BE: row (passwordHash)
    BE->>BE: bcrypt.matches
    BE-->>FE: 200 { email, displayName }
    FE->>Z: setSession({email, displayName, provider:'password', basicAuthToken})
    Z->>Z: localStorage.setItem('auth.session', …)
    FE->>FE: navigate(state.from ?? '/')
    FE-->>U: success toast
```

#### 4b — Google OAuth (edge case: popup blocked)



```mermaid
sequenceDiagram
    actor U as User
    participant FE as LoginPage
    participant FB as Firebase Auth
    participant G as Google
    U->>FE: click "Sign in with Google"
    FE->>FB: signInWithPopup(GoogleAuthProvider)
    FB->>G: open popup
    G-->>FB: auth/popup-blocked
    FB-->>FE: FirebaseError(code='auth/popup-blocked')
    FE-->>U: error toast (auth.errors.popupBlocked)
```

---

### FEAT-20260512-03 — Dashboard and core UI modernization

#### 4a — Edit a client (happy path)

```mermaid
sequenceDiagram
    actor U as User
    participant L as ClientsListPage
    participant S as Sheet (ClientForm)
    participant API as clientsApi.updateClient
    participant BE as Spring Boot
    U->>L: click row "Edit" on Acme
    L->>S: open Sheet with initial=Acme
    S-->>U: slide-in animation (Framer Motion)
    U->>S: change email, submit
    S->>S: zod validate (react-hook-form)
    S->>API: PUT /api/v1/clients/uuid-1
    API->>BE: PUT with JSON body
    BE-->>API: 200 + updated Client
    API-->>S: Client
    S->>L: onSubmit resolved → refetch() + show toast
    L-->>U: row updates with new email, toast "Client updated"
```

#### 4b — Delete confirmation cancel (edge case)

```mermaid
sequenceDiagram
    actor U as User
    participant L as ClientsListPage
    participant D as AlertDialog
    U->>L: click row "Delete" on Globex
    L->>D: open AlertDialog (clientName=Globex)
    U->>D: click Cancel
    D->>L: onCancel → close, no API call
    L-->>U: row still present, no toast
```
