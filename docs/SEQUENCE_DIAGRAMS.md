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

---

### FEAT-20260513-02 — Invoice PDF generation and email delivery to clients

#### 4a Happy path: render PDF + send email

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant BE as InvoiceController
    participant SVC as InvoiceService
    participant REPO as InvoiceRepository
    participant PDF as InvoicePdfRenderer
    participant MAIL as InvoiceMailer
    participant SMTP as MailHog
    U->>FE: click "View PDF"
    FE->>BE: GET /api/v1/invoices/{id}/pdf
    BE->>SVC: getPdf(id)
    SVC->>REPO: findByIdWithLines(id)
    REPO-->>SVC: Invoice + lines + client
    SVC->>PDF: render(invoice, client, company)
    PDF-->>SVC: byte[]
    SVC-->>BE: byte[]
    BE-->>FE: 200 application/pdf
    FE-->>U: iframe preview

    U->>FE: click "Send to Client"
    FE->>BE: POST /api/v1/invoices/{id}/send-email
    BE->>SVC: send(id)
    SVC->>REPO: findByIdWithLines(id)
    SVC->>PDF: render(...)
    PDF-->>SVC: byte[]
    SVC->>MAIL: send(to=client.email, subject, body, pdfBytes)
    MAIL->>SMTP: SMTP DATA
    SMTP-->>MAIL: 250 OK
    SVC->>REPO: updateLastSentAt(id, now)
    REPO-->>SVC: ok
    SVC-->>BE: { lastSentAt }
    BE-->>FE: 200 { lastSentAt }
    FE-->>U: toast + badge "Sent on …"
```

#### 4b Edge case: SMTP failure does not persist `last_sent_at`

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant BE as InvoiceController
    participant SVC as InvoiceService
    participant MAIL as InvoiceMailer
    participant SMTP as MailHog (down)
    U->>FE: click "Send to Client"
    FE->>BE: POST /send-email
    BE->>SVC: send(id)
    SVC->>MAIL: send(...)
    MAIL->>SMTP: SMTP connect
    SMTP-->>MAIL: connection refused
    MAIL-->>SVC: throws MailSendException
    Note over SVC: NO writes to invoices table<br/>last_sent_at unchanged
    SVC-->>BE: throws EmailDeliveryFailedException
    BE-->>FE: 502 problem+json { code: EMAIL_DELIVERY_FAILED }
    FE-->>U: error toast; lastSentAt badge unchanged
```

---

### FEAT-20260513-03 — Invoice Sharing (DOCX template rendering, PDF conversion, email delivery)

#### Happy path: render PDF and email it

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant BE as InvoiceRenderController
    participant SVC as InvoiceRenderService
    participant REPO as InvoiceRepository
    participant DOCX as PoiTlInvoiceDocxRenderer
    participant TPL as FilesystemInvoiceTemplateStore
    participant PDF as LibreOfficePdfConverter
    participant LO as soffice headless
    participant MAIL as InvoiceMailer
    participant SMTP as MailHog

    U->>FE: click "Send to Client"
    FE->>BE: POST /api/v1/invoices/{id}/docx-email
    BE->>SVC: send(id)
    SVC->>REPO: findByIdWithLines(id)
    REPO-->>SVC: Invoice + lines + client
    SVC->>DOCX: render(invoice, client, company)
    DOCX->>TPL: openTemplate()
    TPL-->>DOCX: InputStream (FS or classpath)
    DOCX-->>SVC: docxBytes
    SVC->>PDF: convert(docxBytes)
    PDF->>LO: soffice --headless --convert-to pdf --outdir <tmp>
    LO-->>PDF: invoice-XXX.pdf
    PDF-->>SVC: pdfBytes
    SVC->>MAIL: send(invoice, client.email, pdfBytes, company, clientName)
    MAIL->>SMTP: SMTP DATA + MIME multipart
    SMTP-->>MAIL: 250 OK
    SVC->>REPO: updateLastSentAt(id, now)
    SVC-->>BE: { lastSentAt }
    BE-->>FE: 200 { lastSentAt }
    FE-->>U: toast + badge "Sent on …"
```

#### Edge case: LibreOffice conversion fails — no last_sent_at write

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant BE as InvoiceRenderController
    participant SVC as InvoiceRenderService
    participant PDF as LibreOfficePdfConverter
    participant LO as soffice (crashes or 20 s timeout)
    U->>FE: click "Send to Client"
    FE->>BE: POST /api/v1/invoices/{id}/docx-email
    BE->>SVC: send(id)
    SVC->>PDF: convert(docxBytes)
    PDF->>LO: soffice --headless --convert-to pdf
    LO-->>PDF: exit 1 / SIGKILL after timeout
    PDF-->>SVC: throws PdfConversionFailedException
    Note over SVC: NO call to mailer<br/>NO write to last_sent_at
    SVC-->>BE: throws PdfConversionFailedException
    BE-->>FE: 502 problem+json { code: PDF_CONVERSION_FAILED }
    FE-->>U: error toast; lastSentAt unchanged
```

---

### FEAT-20260513-01 — Design System & UI Standards

#### Dark mode — Register form (happy path)

```mermaid
sequenceDiagram
    actor U as User (dark mode, mobile)
    participant Theme as ThemeProvider
    participant Page as RegisterPage
    participant Form as RegisterForm
    participant PF as PasswordField (x2)
    U->>Theme: open /register, OS = dark
    Theme->>Theme: apply .dark on <html>
    Page->>Form: render via AuthSplitLayout
    Form->>PF: render password + confirmPassword fields
    Note over Form,PF: labels/inputs/icons read --color-foreground\nfields stack vertically full-width on <640px
    U->>PF: type passwords (independent show/hide)
    U->>Form: submit
    Form->>Form: zod refine password === confirmPassword
    alt mismatch
        Form-->>U: inline error in --color-destructive
    else match
        Form-->>U: success toast + navigate /login
    end
```

#### Search clear (happy path + edge cases)

```mermaid
sequenceDiagram
    actor U as User
    participant CP as ClientsPage
    participant API as useClients hook
    U->>CP: type "acme" in search
    CP->>API: refetch with query=acme
    U->>CP: press Escape (or click Clear)
    CP->>CP: setSearch(""); setPage(0)
    CP->>API: refetch without query param
    API-->>CP: full unfiltered page
    CP-->>U: input is empty, table re-renders
```
