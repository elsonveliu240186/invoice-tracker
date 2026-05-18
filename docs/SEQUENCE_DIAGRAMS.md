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
<<<<<<< HEAD

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

---

### FEAT-20260514-01 — Dashboard upgrade (stats, charts, palette, invoice status)

#### 4.1 Happy path — load dashboard

```mermaid
sequenceDiagram
    actor U as User
    participant FE as DashboardPage
    participant Hook as useDashboardStats
    participant API as fetch /api/v1/dashboard/stats
    participant BE as DashboardController
    participant SVC as DashboardService
    participant DB as Postgres
    U->>FE: navigate to /
    FE->>Hook: mount
    Hook->>API: GET /api/v1/dashboard/stats (Basic auth)
    API->>BE: HTTP
    BE->>SVC: getStats()
    SVC->>DB: countByStatus / revenueByStatus / revenueByMonth(6)
    DB-->>SVC: rows
    SVC-->>BE: DashboardStatsResponse
    BE-->>API: 200 JSON
    API-->>Hook: data
    Hook-->>FE: { data, loading=false, error=null }
    FE-->>U: banner + 4 cards + 2 charts
```

#### 4.2 Edge case — mark as paid

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant Hook as useMarkInvoicePaid
    participant BE as InvoiceController.markPaid
    participant DB as Postgres
    U->>FE: click "Mark as Paid"
    FE->>Hook: trigger(id)
    Hook->>BE: PATCH /api/v1/invoices/{id}/mark-paid
    BE->>DB: UPDATE invoices SET status='PAID' WHERE id=:id AND deleted_at IS NULL
    DB-->>BE: 1 row
    BE-->>Hook: 200 InvoiceResponse (status="PAID")
    Hook-->>FE: refetch invoice
    FE-->>U: badge flips to PAID, button hides, toast "Invoice marked as paid"
```

---

### FEAT-20260514-02 — Invoice template editor and full lifecycle

#### 4a. Happy path — preview, generate, download

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant Prev as PreviewInvoiceButton
    participant Gen as GenerateInvoiceButton
    participant DL as DownloadInvoiceMenu
    participant API as Backend
    participant SVC as InvoiceArtifactService
    participant FS as Filesystem
    participant DB as Postgres
    U->>FE: open /invoices/:id
    FE->>API: GET /api/v1/invoices/{id}
    FE->>API: GET /api/v1/invoices/{id}/generated/metadata
    API-->>FE: { pdf: null, docx: null }
    U->>Prev: click Preview
    Prev->>API: GET /api/v1/invoices/{id}/preview-pdf
    API->>SVC: previewPdf(id)
    SVC->>SVC: render on-the-fly (no persist)
    API-->>Prev: 200 application/pdf (blob)
    Prev-->>U: iframe blob URL in modal
    U->>Gen: click "Generate & Save" → PDF
    Gen->>API: POST /api/v1/invoices/{id}/generate?format=PDF
    API->>SVC: generate(id, PDF)
    SVC->>SVC: pdfRenderer.render(...)
    SVC->>FS: write ./generated/invoices/{id}.pdf
    SVC->>DB: upsert invoice_generated_artifacts (id, PDF, path, size, sha256)
    API-->>Gen: 201 { format:PDF, generatedAt, sizeBytes }
    Gen-->>FE: refetch metadata → badge "Generated PDF · ..."
    U->>DL: Download → PDF
    DL->>API: GET /api/v1/invoices/{id}/generated?format=PDF
    API->>SVC: streamGenerated(id, PDF)
    SVC->>DB: lookup row
    SVC->>FS: read file
    API-->>DL: 200 application/pdf
    DL-->>U: browser save dialog
```

#### 4b. Send email with saved PDF

```mermaid
sequenceDiagram
    actor U as User
    participant FE as InvoiceDetailPage
    participant Send as SendInvoiceButton
    participant API as Backend
    participant INV_SVC as InvoiceService
    participant ART_SVC as InvoiceArtifactService
    participant FS as Filesystem
    participant MAIL as InvoiceMailer
    participant SMTP as MailHog
    U->>Send: click "Send by Email" (confirm dialog)
    Send->>API: POST /api/v1/invoices/{id}/send-email
    API->>INV_SVC: sendEmail(id)
    INV_SVC->>ART_SVC: findPdfBytes(id)
    ART_SVC->>FS: read ./generated/invoices/{id}.pdf
    FS-->>ART_SVC: byte[]
    ART_SVC-->>INV_SVC: Optional<byte[]> present
    Note over INV_SVC: skips pdfRenderer.render — uses saved bytes
    INV_SVC->>MAIL: send(to=client.email, pdfBytes)
    MAIL->>SMTP: SMTP DATA
    SMTP-->>MAIL: 250 OK
    INV_SVC->>INV_SVC: updateLastSentAt(id, now)
    API-->>Send: 200 { lastSentAt }
    Send-->>U: toast "Sent" + badge "Sent on …"
```

#### 4c. Edge case — regenerate after template change

```mermaid
sequenceDiagram
    actor U as User
    participant Tpl as InvoiceTemplateManagerPage
    participant FE as InvoiceDetailPage
    participant API as Backend
    participant SVC as InvoiceArtifactService
    U->>Tpl: upload new template.docx
    Tpl->>API: POST /api/v1/settings/invoice-template
    API-->>Tpl: 200 (template replaced)
    Note over Tpl,API: existing artefacts are NOT auto-invalidated
    U->>FE: open /invoices/:id
    FE-->>U: badge still shows old "Generated PDF · 12 May"
    U->>FE: click "Regenerate" in DownloadMenu
    FE->>API: POST /api/v1/invoices/{id}/generate?format=PDF&overwrite=true
    API->>SVC: generate(id, PDF, overwrite=true)
    SVC->>SVC: render with new template
    SVC->>API: persist; bump generated_at
    API-->>FE: 200 { format:PDF, generatedAt: now, sha256 changed }
    FE-->>U: badge updated, toast "Regenerated"
```

---

### FEAT-20260516-01 — Expense tracking with category dashboard

#### 4a. Create expense — dashboard refresh (happy path)

```mermaid
sequenceDiagram
    actor U as User
    participant FE as ExpensesPage
    participant Sheet as ExpenseFormSheet
    participant API as React hooks
    participant BE as ExpenseController
    participant SVC as ExpenseService
    participant DB as Postgres
    U->>FE: click "+ New Expense"
    FE->>Sheet: open(editing=null)
    U->>Sheet: fill amount/category/date, submit
    Sheet->>Sheet: Zod parse — form values
    Sheet->>API: useCreateExpense.mutate(payload)
    API->>BE: POST /api/v1/expenses (Basic auth)
    BE->>BE: @Valid CreateExpenseRequest
    BE->>SVC: ExpenseService.create(cmd)
    SVC->>DB: INSERT into expenses
    DB-->>SVC: 1 row
    SVC-->>BE: Expense domain record
    BE-->>API: 201 + ExpenseResponse + Location
    API-->>Sheet: resolved
    Sheet->>FE: onClose + onSubmitted
    FE->>API: useExpenses.refetch() + useExpenseSummary.refetch()
    API->>BE: GET /api/v1/expenses?... and /summary?month=...
    BE-->>API: updated list + summary
    API-->>FE: new state
    FE-->>U: toast "Expense created", updated cards + table
```

#### 4b. Edge case — change month (no expenses present)

```mermaid
sequenceDiagram
    actor U as User
    participant FE as ExpensesPage
    participant Dash as ExpenseDashboard
    participant API as useExpenseSummary
    participant BE as ExpenseController
    U->>Dash: select month=2025-12
    Dash->>FE: onMonthChange("2025-12")
    FE->>API: refetch with month=2025-12
    API->>BE: GET /api/v1/expenses/summary?month=2025-12
    BE-->>API: {grandTotal:"0.00", totalCount:0, byCategory:[]}
    API-->>FE: empty summary
    FE-->>U: render EmptyState "No expenses for December 2025" inside dashboard area; expense table also filtered to that month shows empty row
```

#### 4c. Auth rate-limit — brute-force protection

```mermaid
sequenceDiagram
    actor A as Attacker
    participant Filter as AuthRateLimitFilter
    participant BE as AuthController
    participant Bucket as Bucket4j (in-memory)
    loop First 5 requests in 1-minute window
        A->>Filter: POST /api/v1/auth/login
        Filter->>Bucket: tryConsume(1) for IP
        Bucket-->>Filter: true (tokens remain)
        Filter->>BE: pass through
        BE-->>A: 401 Unauthorized
    end
    A->>Filter: POST /api/v1/auth/login (6th attempt)
    Filter->>Bucket: tryConsume(1) for IP
    Bucket-->>Filter: false (bucket empty)
    Filter-->>A: 429 Too Many Requests {code:"RATE_LIMIT_EXCEEDED"}
    Note over Filter: BE is never reached
```

---

### FEAT-20260518-01 — True E2E smoke + regression suite

#### E2E per-test reset flow

This diagram shows what happens before each Playwright spec. The `resetBackend()` call is wired into `beforeEach` in `tests/e2e/fixtures/test.ts`; `purgeMailhog()` runs from the same hook. The schema-level clean/migrate happens once per container start (not shown here — see `FlywayCleanMigrateInitializer`).

```mermaid
sequenceDiagram
    actor PW as Playwright<br/>(beforeEach fixture)
    participant Fix as fixtures/test.ts
    participant API as E2eResetController<br/>POST /api/v1/test-support/reset
    participant SVC as reset() method
    participant DB as Postgres (e2e DB)
    participant MH as MailHog REST API<br/>DELETE /api/v1/messages

    PW->>Fix: beforeEach hook fires
    Fix->>API: POST /api/v1/test-support/reset<br/>Authorization: Basic <e2e credentials>
    API->>API: @Profile("e2e") guard — bean present
    API->>API: SecurityConfig.anyRequest().authenticated()<br/>→ 401 if no valid Basic header
    API->>SVC: reset()
    SVC->>DB: TRUNCATE invoice_generated_artifacts CASCADE
    SVC->>DB: TRUNCATE invoice_lines CASCADE
    SVC->>DB: TRUNCATE invoices CASCADE
    SVC->>DB: TRUNCATE expenses CASCADE
    SVC->>DB: TRUNCATE clients CASCADE
    SVC->>DB: TRUNCATE app_users CASCADE
    SVC->>DB: DELETE FROM company_profile WHERE id = 1<br/>INSERT blank seed row
    DB-->>SVC: OK
    SVC-->>API: void
    API-->>Fix: HTTP 204 No Content
    Fix->>MH: DELETE http://localhost:8026/api/v1/messages
    MH-->>Fix: HTTP 200 (inbox cleared)
    Fix-->>PW: beforeEach complete — clean state for spec
```

#### E2E reset — error paths

```mermaid
sequenceDiagram
    actor PW as Playwright
    participant API as E2eResetController

    note over PW,API: Scenario A — reset endpoint called in non-e2e profile (production guard)
    PW->>API: POST /api/v1/test-support/reset
    API-->>PW: HTTP 404 Not Found<br/>(bean absent — @Profile("e2e") excluded)

    note over PW,API: Scenario B — missing credentials
    PW->>API: POST /api/v1/test-support/reset<br/>(no Authorization header)
    API-->>PW: HTTP 401 Unauthorized<br/>(SecurityConfig HttpStatusEntryPoint)
```

#### Smoke vs. regression CI flow

```mermaid
sequenceDiagram
    participant GH as GitHub Actions
    participant BS as e2e-smoke job<br/>(every PR + push)
    participant BR as e2e-regression job<br/>(nightly + push to main)
    participant DC as docker-compose.e2e.yml
    participant PW as Playwright

    GH->>BS: PR opened / push event
    BS->>DC: docker compose up -d --build --wait
    DC-->>BS: all 4 services healthy<br/>(postgres, mailhog, backend, frontend)
    BS->>PW: pnpm e2e:smoke (Chrome only)
    PW-->>BS: smoke results
    alt smoke PASS
        BS-->>GH: check green — merge allowed
    else smoke FAIL
        BS->>GH: upload Playwright HTML report + backend logs
        BS-->>GH: check red — merge blocked
    end
    BS->>DC: docker compose down -v

    GH->>BR: schedule 0 2 * * * / push to main
    BR->>DC: docker compose up -d --build --wait
    BR->>PW: pnpm e2e:regression (Chrome + Firefox)
    PW-->>BR: regression results
    alt regression FAIL
        BR->>GH: upload full Playwright trace
    end
    BR->>DC: docker compose down -v
```
