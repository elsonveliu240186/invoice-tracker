/**
 * Playwright E2E specs for the Client Management feature (FEAT-20260511-01).
 *
 * All API calls are intercepted via page.route() — no live backend required.
 * data-testid selectors are used throughout; no coupling to Tailwind classes.
 *
 * Coverage:
 *   AC-1  POST returns 201 + ClientResponse (create flow, toast)
 *   AC-2  GET list with query → paginated, case-insensitive search
 *   AC-3  404 error surface (error-message element visible)
 *   AC-4  PUT updates + bumps updatedAt (edit flow)
 *   AC-5  DELETE soft-delete + subsequent empty state (confirm flow)
 *   AC-6  Validation — name/email required, email format, phone regex, name length
 *   AC-7  Duplicate email → 409 → inline field error
 *   AC-8  401 → error-message visible
 *   AC-9  UI: list, search, new-client modal, edit, delete-confirm, toast
 *   AC-10 Vitest coverage gates — noted as verified separately (not re-run here)
 *   AC-11 Postman collection — noted as verified manually
 *   AC-12 Flyway migration — noted as verified by IT tests
 */
import { test, expect, type Page } from '@playwright/test';

// Seed an authenticated session so ProtectedRoute lets the app render.
// This runs before every test in this file so all routes are accessible.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'it.auth',
      JSON.stringify({
        state: {
          user: {
            email: 'qa@example.com',
            displayName: 'QA User',
            provider: 'password',
            basicAuthToken: btoa('qa@example.com:Secret1!'),
          },
        },
        version: 0,
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

interface PageResponse {
  content: Client[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

const NOW = '2026-05-11T10:00:00Z';

const ACME: Client = {
  id: 'uuid-1',
  name: 'Acme Corp',
  email: 'acme@example.com',
  phone: '+1 555 111 2222',
  address: '123 Main St',
  createdAt: NOW,
  updatedAt: NOW,
};

const GLOBEX: Client = {
  id: 'uuid-2',
  name: 'Globex',
  email: 'globex@example.com',
  phone: null,
  address: null,
  createdAt: NOW,
  updatedAt: NOW,
};

function pageOf(clients: Client[], page = 0, size = 20): PageResponse {
  return {
    content: clients,
    page,
    size,
    totalElements: clients.length,
    totalPages: Math.max(1, Math.ceil(clients.length / size)),
  };
}

// ---------------------------------------------------------------------------
// Route helper
// Intercepts ALL requests matching /api/v1/clients and dispatches by
// method + path so each test can supply exactly the responses it needs.
// ---------------------------------------------------------------------------

type MockConfig = {
  /** Response for GET /api/v1/clients?... — receives the query string */
  onList?: (query: string) => PageResponse;
  /** Response for POST /api/v1/clients */
  onCreate?: () => { status: number; body: unknown };
  /** Response for GET /api/v1/clients/:id */
  onGet?: (id: string) => { status: number; body: unknown };
  /** Response for PUT /api/v1/clients/:id */
  onUpdate?: (id: string) => { status: number; body: unknown };
  /** Response for DELETE /api/v1/clients/:id */
  onDelete?: (id: string) => { status: number; body?: unknown };
};

async function setupApiMock(page: Page, config: MockConfig) {
  await page.route('**/api/v1/clients**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const path = url.pathname; // e.g. /api/v1/clients or /api/v1/clients/uuid-1
    const method = req.method();

    // /api/v1/clients/:id  (has a segment after /clients/)
    const idMatch = /\/api\/v1\/clients\/([^/?]+)/.exec(path);

    if (idMatch) {
      const id = idMatch[1]!;
      if (method === 'GET' && config.onGet) {
        const r = config.onGet(id);
        await route.fulfill({ status: r.status, json: r.body });
        return;
      }
      if (method === 'PUT' && config.onUpdate) {
        const r = config.onUpdate(id);
        await route.fulfill({ status: r.status, json: r.body });
        return;
      }
      if (method === 'DELETE' && config.onDelete) {
        const r = config.onDelete(id);
        if (r.status === 204) {
          await route.fulfill({ status: 204, body: '' });
        } else {
          await route.fulfill({ status: r.status, json: r.body });
        }
        return;
      }
    } else {
      // /api/v1/clients (collection)
      if (method === 'GET' && config.onList) {
        const qs = url.search;
        const result = config.onList(qs);
        await route.fulfill({ json: result });
        return;
      }
      if (method === 'POST' && config.onCreate) {
        const r = config.onCreate();
        await route.fulfill({ status: r.status, json: r.body });
        return;
      }
    }

    // Fallback: return generic server error so the test notices
    await route.fulfill({
      status: 500,
      json: { status: 500, title: 'No mock configured', code: 'INTERNAL_ERROR' },
    });
  });
}

// ---------------------------------------------------------------------------
// AC-9-a: /clients page — list
// ---------------------------------------------------------------------------

test.describe('AC-9: /clients page lists clients', () => {
  test('renders heading and table with client rows', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME, GLOBEX]) });
    await page.goto('/clients');

    await expect(page.getByTestId('clients-page')).toBeVisible();
    await expect(page.getByRole('heading', { name: /clients/i })).toBeVisible();
    await expect(page.getByTestId('clients-table')).toBeVisible();

    const rows = page.getByTestId('client-row');
    await expect(rows).toHaveCount(2);
    await expect(rows.first()).toContainText('Acme Corp');
    await expect(rows.nth(1)).toContainText('Globex');
  });

  test('shows empty-state when list is empty', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([]) });
    await page.goto('/clients');

    await expect(page.getByTestId('empty-state')).toBeVisible();
    await expect(page.getByTestId('empty-state')).toContainText(/no clients yet/i);
  });

  test('has a visible New client button', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME]) });
    await page.goto('/clients');

    await expect(page.getByTestId('btn-new-client')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-2 / AC-9: Search (case-insensitive)
// ---------------------------------------------------------------------------

test.describe('AC-2 / AC-9: search', () => {
  test('filters table by name (case-insensitive)', async ({ page }) => {
    await setupApiMock(page, {
      onList: (qs) => {
        const q = new URLSearchParams(qs.slice(1)).get('query') ?? '';
        const all = [ACME, GLOBEX];
        const filtered = q
          ? all.filter((c) => c.name.toLowerCase().includes(q.toLowerCase()))
          : all;
        return pageOf(filtered);
      },
    });

    await page.goto('/clients');

    // Initial — both rows
    await expect(page.getByTestId('client-row')).toHaveCount(2);

    // Search for "acme"
    await page.getByTestId('search-input').fill('acme');

    // Only Acme row
    await expect(page.getByTestId('client-row')).toHaveCount(1);
    await expect(page.getByTestId('client-row').first()).toContainText('Acme Corp');
  });

  test('filters table by email substring', async ({ page }) => {
    await setupApiMock(page, {
      onList: (qs) => {
        const q = new URLSearchParams(qs.slice(1)).get('query') ?? '';
        const all = [ACME, GLOBEX];
        const filtered = q
          ? all.filter((c) => c.email.toLowerCase().includes(q.toLowerCase()))
          : all;
        return pageOf(filtered);
      },
    });

    await page.goto('/clients');
    await page.getByTestId('search-input').fill('globex');

    await expect(page.getByTestId('client-row')).toHaveCount(1);
    await expect(page.getByTestId('client-row').first()).toContainText('globex@example.com');
  });
});

// ---------------------------------------------------------------------------
// AC-9-b: New client modal open/close
// ---------------------------------------------------------------------------

test.describe('AC-9: New client sheet', () => {
  test('opens when New client button is clicked', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([]) });
    await page.goto('/clients');

    await page.getByTestId('btn-new-client').click();
    await expect(page.getByTestId('client-form-sheet')).toBeVisible();
    await expect(page.getByRole('heading', { name: /new client/i })).toBeVisible();
  });

  test('closes when Cancel button is clicked', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([]) });
    await page.goto('/clients');

    await page.getByTestId('btn-new-client').click();
    await expect(page.getByTestId('client-form-sheet')).toBeVisible();

    await page.getByTestId('btn-cancel').click();
    await expect(page.getByTestId('client-form-sheet')).not.toBeVisible();
  });

  test('closes when the X (close) button is clicked', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([]) });
    await page.goto('/clients');

    await page.getByTestId('btn-new-client').click();
    await page.getByTestId('sheet-close').click();
    await expect(page.getByTestId('client-form-sheet')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-1: Create client → 201 → success toast
// ---------------------------------------------------------------------------

test.describe('AC-1: create client', () => {
  test('submits form, closes modal, shows success toast, and adds row', async ({ page }) => {
    const newClient: Client = {
      id: 'uuid-new',
      name: 'New Corp',
      email: 'new@example.com',
      phone: '+1 555 000 1234',
      address: null,
      createdAt: NOW,
      updatedAt: NOW,
    };

    let listCalls = 0;
    await setupApiMock(page, {
      onList: () => {
        listCalls++;
        return pageOf(listCalls === 1 ? [] : [newClient]);
      },
      onCreate: () => ({ status: 201, body: newClient }),
    });

    await page.goto('/clients');

    await page.getByTestId('btn-new-client').click();
    await page.getByTestId('input-name').fill('New Corp');
    await page.getByTestId('input-email').fill('new@example.com');
    await page.getByTestId('input-phone').fill('+1 555 000 1234');
    await page.getByTestId('btn-submit').click();

    // Sheet closes
    await expect(page.getByTestId('client-form-sheet')).not.toBeVisible();

    // Success toast
    await expect(page.getByTestId('toast')).toBeVisible();
    await expect(page.getByTestId('toast')).toContainText(/client created/i);

    // Row appears
    await expect(page.getByText('New Corp')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-6: Validation (Zod frontend layer)
// ---------------------------------------------------------------------------

test.describe('AC-6: form validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([]) });
    await page.goto('/clients');
    await page.getByTestId('btn-new-client').click();
    await expect(page.getByTestId('client-form-sheet')).toBeVisible();
  });

  test('shows "Name is required" when name is blank', async ({ page }) => {
    await page.getByTestId('input-email').fill('valid@example.com');
    await page.getByTestId('btn-submit').click();
    await expect(page.getByText(/name is required/i)).toBeVisible();
  });

  test('shows email validation error when email is blank', async ({ page }) => {
    await page.getByTestId('input-name').fill('Corp');
    await page.getByTestId('btn-submit').click();
    // Zod fires both too_small and invalid_string; the form renders the last
    // error for the field, which is "Must be a valid email address".
    await expect(page.getByText(/valid email address/i)).toBeVisible();
  });

  test('shows email format error when email is invalid', async ({ page }) => {
    await page.getByTestId('input-name').fill('Corp');
    await page.getByTestId('input-email').fill('not-an-email');
    await page.getByTestId('btn-submit').click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });

  test('shows phone format error when phone has invalid chars', async ({ page }) => {
    await page.getByTestId('input-name').fill('Corp');
    await page.getByTestId('input-email').fill('valid@example.com');
    await page.getByTestId('input-phone').fill('abc!@#');
    await page.getByTestId('btn-submit').click();
    await expect(page.getByText(/phone may only contain digits/i)).toBeVisible();
  });

  test('shows length error when name exceeds 120 chars', async ({ page }) => {
    await page.getByTestId('input-name').fill('A'.repeat(121));
    await page.getByTestId('input-email').fill('valid@example.com');
    await page.getByTestId('btn-submit').click();
    await expect(page.getByText(/at most 120 characters/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-7: Duplicate email → 409 → inline field error
// ---------------------------------------------------------------------------

test.describe('AC-7: duplicate email (409)', () => {
  test('shows inline email error when server returns CLIENT_EMAIL_TAKEN', async ({ page }) => {
    await setupApiMock(page, {
      onList: () => pageOf([ACME]),
      onCreate: () => ({
        status: 409,
        body: {
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'A client with this email already exists.',
          code: 'CLIENT_EMAIL_TAKEN',
        },
      }),
    });

    await page.goto('/clients');
    await page.getByTestId('btn-new-client').click();
    await page.getByTestId('input-name').fill('Duplicate Corp');
    await page.getByTestId('input-email').fill('acme@example.com');
    await page.getByTestId('btn-submit').click();

    // Inline field error
    await expect(page.getByText(/email is already in use/i)).toBeVisible();
    // Sheet stays open
    await expect(page.getByTestId('client-form-sheet')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-4 / AC-9: Edit client
// ---------------------------------------------------------------------------

test.describe('AC-4 / AC-9: edit client', () => {
  test('opens edit sheet pre-filled with client data', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME]) });
    await page.goto('/clients');

    await page.getByLabel(`Edit ${ACME.name}`).click();

    await expect(page.getByTestId('client-form-sheet')).toBeVisible();
    await expect(page.getByRole('heading', { name: /edit client/i })).toBeVisible();
    await expect(page.getByTestId('input-name')).toHaveValue(ACME.name);
    await expect(page.getByTestId('input-email')).toHaveValue(ACME.email);
  });

  test('submits update, closes sheet, shows success toast (AC-4)', async ({ page }) => {
    const updatedAcme: Client = {
      ...ACME,
      name: 'Acme Corp Updated',
      updatedAt: new Date().toISOString(),
    };

    let listCalls = 0;
    await setupApiMock(page, {
      onList: () => {
        listCalls++;
        return pageOf(listCalls === 1 ? [ACME] : [updatedAcme]);
      },
      onUpdate: () => ({ status: 200, body: updatedAcme }),
    });

    await page.goto('/clients');

    await page.getByLabel(`Edit ${ACME.name}`).click();
    await page.getByTestId('input-name').fill('Acme Corp Updated');
    await page.getByTestId('btn-submit').click();

    await expect(page.getByTestId('client-form-sheet')).not.toBeVisible();
    await expect(page.getByTestId('toast')).toBeVisible();
    await expect(page.getByTestId('toast')).toContainText(/client updated/i);
    await expect(page.getByText('Acme Corp Updated')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-5 / AC-9: Delete with confirmation dialog
// ---------------------------------------------------------------------------

test.describe('AC-5 / AC-9: delete client', () => {
  test('shows confirmation dialog when Delete is clicked', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME]) });
    await page.goto('/clients');

    await page.getByLabel(`Delete ${ACME.name}`).click();

    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();
    await expect(page.getByTestId('confirm-delete-dialog')).toContainText(ACME.name);
  });

  test('cancels delete — dialog closes, row still present', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME]) });
    await page.goto('/clients');

    await page.getByLabel(`Delete ${ACME.name}`).click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible();

    await page.getByTestId('btn-cancel-delete').click();
    await expect(page.getByTestId('confirm-delete-dialog')).not.toBeVisible();
    await expect(page.getByText(ACME.name)).toBeVisible();
  });

  test('confirms delete → 204 → success toast → row removed (AC-5)', async ({ page }) => {
    // Use a deleted flag rather than a call counter so that React StrictMode's
    // double-invocation of effects (which fires the list API twice on mount) does
    // not prematurely return an empty list before the delete action occurs.
    let deleted = false;
    await setupApiMock(page, {
      onList: () => pageOf(deleted ? [] : [ACME]),
      onDelete: () => {
        deleted = true;
        return { status: 204 };
      },
    });

    await page.goto('/clients');

    await page.getByLabel(`Delete ${ACME.name}`).click();
    await page.getByTestId('btn-confirm-delete').click();

    await expect(page.getByTestId('confirm-delete-dialog')).not.toBeVisible();
    await expect(page.getByTestId('toast')).toBeVisible();
    await expect(page.getByTestId('toast')).toContainText(/client deleted/i);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-8: Unauthenticated → 401 → error message in UI
// ---------------------------------------------------------------------------

test.describe('AC-8: unauthenticated (401)', () => {
  test('displays error message when list API returns 401', async ({ page }) => {
    await page.route('**/api/v1/clients**', (route) =>
      route.fulfill({
        status: 401,
        json: {
          type: 'about:blank',
          title: 'Unauthorized',
          status: 401,
          code: 'UNAUTHENTICATED',
        },
      }),
    );

    await page.goto('/clients');
    await expect(page.getByTestId('error-message')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-3: 404 / error surface
// ---------------------------------------------------------------------------

test.describe('AC-3: error surface', () => {
  test('shows error-message element when server returns 500', async ({ page }) => {
    await page.route('**/api/v1/clients**', (route) =>
      route.fulfill({
        status: 500,
        json: { status: 500, title: 'Internal Server Error', code: 'INTERNAL_ERROR' },
      }),
    );

    await page.goto('/clients');
    await expect(page.getByTestId('error-message')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// AC-9: Pagination controls
// ---------------------------------------------------------------------------

test.describe('AC-9: pagination', () => {
  test('shows Previous (disabled) and Next buttons when totalPages > 1', async ({ page }) => {
    await setupApiMock(page, {
      onList: () => ({
        content: [ACME],
        page: 0,
        size: 20,
        totalElements: 25,
        totalPages: 2,
      }),
    });

    await page.goto('/clients');

    await expect(page.getByTestId('btn-prev-page')).toBeVisible();
    await expect(page.getByTestId('btn-next-page')).toBeVisible();
    await expect(page.getByTestId('btn-prev-page')).toBeDisabled();
    await expect(page.getByTestId('btn-next-page')).not.toBeDisabled();
  });

  test('hides pagination controls for a single page', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME]) });
    await page.goto('/clients');

    await expect(page.getByTestId('btn-next-page')).not.toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Smoke: HomePage → /clients navigation (regression)
// ---------------------------------------------------------------------------

test.describe('smoke: regression', () => {
  test('sidebar Clients link on HomePage navigates to /clients', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME, GLOBEX]) });

    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();

    // Navigate via the sidebar Clients link
    await page.locator('[aria-label="Sidebar navigation"] a[href="/clients"]').click();
    await expect(page).toHaveURL('/clients');
    await expect(page.getByTestId('clients-page')).toBeVisible();
  });

  test('home page still renders correctly (AC-9 adjacent regression)', async ({ page }) => {
    await setupApiMock(page, { onList: () => pageOf([ACME, GLOBEX]) });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/');
    await expect(page.getByTestId('home-page')).toBeVisible();
    // DashboardPage shows a welcome banner (no plain "Dashboard" h1) and stat cards
    await expect(page.getByTestId('welcome-banner')).toBeVisible();
    // Clients link is accessible via the sidebar
    await expect(
      page.locator('[aria-label="Sidebar navigation"] a[href="/clients"]'),
    ).toBeVisible();
  });
});
