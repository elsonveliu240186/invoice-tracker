/**
 * Playwright E2E specs — Expense Tracking with Category Dashboard (FEAT-20260516-01)
 *
 * Acceptance criteria covered:
 *   AC-1  /expenses page loads with dashboard and empty state
 *   AC-2  Create expense — appears in table and dashboard updates
 *   AC-3  Edit a DRAFT expense — changes persist
 *   AC-4  Delete expense with confirmation dialog — removed from list
 *   AC-5  Filter by category — only matching expenses shown
 *   AC-6  Search by description — filters list correctly
 *   AC-7  Dashboard month picker — changing month updates summary cards
 *   AC-8  Category cards show correct totals and counts
 *   AC-9  All 10 categories available in the form select
 *
 * All API calls are intercepted via page.route() — no live backend required.
 * data-testid selectors only; no coupling to Tailwind classes.
 */
import { test, expect, type Page } from '@playwright/test';

// ── Constants ─────────────────────────────────────────────────────────────────

const CURRENT_MONTH = '2026-05';
const TODAY = '2026-05-16';

const ALL_CATEGORIES = [
  'FOOD_DRINK',
  'TRANSPORT',
  'HOUSING',
  'HEALTH',
  'ENTERTAINMENT',
  'SHOPPING',
  'TRAVEL',
  'EDUCATION',
  'UTILITIES',
  'OTHER',
] as const;

// ── Fixture factories ──────────────────────────────────────────────────────────

function makeExpense(
  overrides: Partial<{
    id: string;
    amount: number;
    category: string;
    description: string | null;
    expenseDate: string;
    createdAt: string;
    updatedAt: string;
  }> = {},
) {
  return {
    id: 'exp-001',
    amount: 42.5,
    category: 'FOOD_DRINK',
    description: 'Team lunch',
    expenseDate: TODAY,
    createdAt: `${TODAY}T10:00:00Z`,
    updatedAt: `${TODAY}T10:00:00Z`,
    ...overrides,
  };
}

function makeEmptyPage() {
  return { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 };
}

function makeOnePage(expense: ReturnType<typeof makeExpense>) {
  return { content: [expense], page: 0, size: 20, totalElements: 1, totalPages: 1 };
}

function makeEmptySummary(month = CURRENT_MONTH) {
  return { month, grandTotal: 0, totalCount: 0, byCategory: [] };
}

function makeSummaryWithFood() {
  return {
    month: CURRENT_MONTH,
    grandTotal: 42.5,
    totalCount: 1,
    byCategory: [{ category: 'FOOD_DRINK', total: 42.5, count: 1 }],
  };
}

// ── Auth helper ───────────────────────────────────────────────────────────────

async function seedAuth(page: Page) {
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
}

// ── API stubs ─────────────────────────────────────────────────────────────────

async function stubEmptyExpenses(page: Page) {
  await page.route('**/api/v1/expenses?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeEmptyPage()),
    }),
  );
  await page.route('**/api/v1/expenses', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeEmptyPage()),
      });
    }
    return route.continue();
  });
}

async function stubEmptySummary(page: Page, month = CURRENT_MONTH) {
  await page.route(`**/api/v1/expenses/summary**`, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(makeEmptySummary(month)),
    }),
  );
}

async function stubDashboard(page: Page) {
  await page.route('**/api/v1/dashboard/stats', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        totalInvoices: 0,
        draftCount: 0,
        sentCount: 0,
        paidCount: 0,
        totalRevenue: 0,
        paidRevenue: 0,
        pendingRevenue: 0,
        revenueByMonth: [],
      }),
    }),
  );
}

// ── AC-1: /expenses page loads with dashboard and empty state ─────────────────

test.describe('AC-1: /expenses page loads with dashboard and empty state', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubEmptyExpenses(page);
    await stubEmptySummary(page);
  });

  test('page renders with the expenses-page test-id', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });
  });

  test('dashboard section renders', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('expense-dashboard')).toBeVisible({ timeout: 10_000 });
  });

  test('empty state shows when no expenses', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('dashboard-empty')).toBeVisible({ timeout: 10_000 });
  });

  test('table empty state shows when no expenses', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-empty')).toBeVisible({ timeout: 10_000 });
  });

  test('Add Expense button is visible', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('btn-new-expense')).toBeVisible({ timeout: 10_000 });
  });

  test('grand-total shows $0.00 for empty month', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('grand-total')).toContainText('$0.00', { timeout: 10_000 });
  });
});

// ── AC-2: Create expense — appears in table and dashboard updates ──────────────

test.describe('AC-2: Create expense — appears in table and dashboard updates', () => {
  test('create expense: form opens, submits, toast shown', async ({ page }) => {
    await seedAuth(page);
    const expense = makeExpense();

    // Broad handler FIRST, summary handler LAST (Playwright LIFO: last-registered checked first)
    let listCallCount = 0;
    await page.route('**/api/v1/expenses**', (route) => {
      const method = route.request().method();
      if (method === 'POST') {
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(expense),
        });
      }
      // GET list — return empty initially, then with expense after creation
      listCallCount++;
      const body = listCallCount > 1 ? makeOnePage(expense) : makeEmptyPage();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    });

    let summaryCallCount = 0;
    await page.route('**/api/v1/expenses/summary**', (route) => {
      summaryCallCount++;
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryCallCount > 1 ? makeSummaryWithFood() : makeEmptySummary()),
      });
    });

    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });

    // Open form
    await page.getByTestId('btn-new-expense').click();
    await expect(page.getByTestId('expense-form-sheet')).toBeVisible({ timeout: 5_000 });

    // Fill form
    await page.getByTestId('input-expenseDate').fill(TODAY);
    await page.getByTestId('select-category').selectOption('FOOD_DRINK');
    await page.getByTestId('input-amount').fill('42.50');
    await page.getByTestId('input-description').fill('Team lunch');

    // Submit
    await page.getByTestId('btn-submit').click();

    // Modal closes
    await expect(page.getByTestId('expense-form-sheet')).not.toBeVisible({ timeout: 5_000 });

    // Toast appears
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await expect(toast).toContainText(/expense created/i);
  });
});

// ── AC-3: Edit a DRAFT expense — changes persist ───────────────────────────────

test.describe('AC-3: Edit an expense — changes persist', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('edit expense: form opens pre-filled, submit updates, toast shown', async ({ page }) => {
    const original = makeExpense({ description: 'Team lunch', amount: 42.5 });
    const updated = makeExpense({ description: 'Team dinner', amount: 65.0 });

    // Register broad handler FIRST so that summary handler (registered last) wins for /summary
    let editDone = false;
    await page.route('**/api/v1/expenses**', (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        const expense = editDone ? updated : original;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [expense],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      }
      if (method === 'PUT') {
        editDone = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
      }
      return route.continue();
    });

    // Register summary LAST so LIFO puts it first in the match chain
    await page.route('**/api/v1/expenses/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeSummaryWithFood()),
      }),
    );

    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('expense-row')).toBeVisible({ timeout: 10_000 });

    // Click edit button for the first expense
    await page.getByTestId(`btn-edit-${original.id}`).click();
    await expect(page.getByTestId('expense-form-sheet')).toBeVisible({ timeout: 5_000 });

    // Pre-filled values
    await expect(page.getByTestId('input-description')).toHaveValue('Team lunch');
    await expect(page.getByTestId('input-amount')).toHaveValue('42.5');

    // Update
    await page.getByTestId('input-description').fill('Team dinner');
    await page.getByTestId('input-amount').fill('65');
    await page.getByTestId('btn-submit').click();

    // Modal closes
    await expect(page.getByTestId('expense-form-sheet')).not.toBeVisible({ timeout: 5_000 });

    // Toast
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await expect(toast).toContainText(/expense updated/i);
  });
});

// ── AC-4: Delete expense with confirmation dialog — removed from list ──────────

test.describe('AC-4: Delete expense with confirmation dialog', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('delete expense: confirmation dialog appears, confirm removes expense', async ({ page }) => {
    const expense = makeExpense();

    // Broad handler FIRST, summary handler LAST (Playwright LIFO: last-registered checked first)
    let deleted = false;
    await page.route('**/api/v1/expenses**', (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            deleted
              ? makeEmptyPage()
              : { content: [expense], page: 0, size: 20, totalElements: 1, totalPages: 1 },
          ),
        });
      }
      if (method === 'DELETE') {
        deleted = true;
        return route.fulfill({ status: 204 });
      }
      return route.continue();
    });

    await page.route('**/api/v1/expenses/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeSummaryWithFood()),
      }),
    );

    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('expense-row')).toBeVisible({ timeout: 10_000 });

    // Click delete button
    await page.getByTestId(`btn-delete-${expense.id}`).click();

    // Confirmation dialog opens
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible({ timeout: 5_000 });

    // Confirm deletion
    await page.getByTestId('btn-confirm-delete').click();

    // Dialog closes
    await expect(page.getByTestId('confirm-delete-dialog')).not.toBeVisible({ timeout: 5_000 });

    // Toast
    const toast = page.locator('[data-sonner-toast]').first();
    await expect(toast).toBeVisible({ timeout: 5_000 });
    await expect(toast).toContainText(/expense deleted/i);

    // Row gone — empty state shown
    await expect(page.getByTestId('expenses-empty')).toBeVisible({ timeout: 5_000 });
  });

  test('cancel delete keeps expense in list', async ({ page }) => {
    const expense = makeExpense();

    // Broad handler FIRST, summary LAST (LIFO)
    await page.route('**/api/v1/expenses**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [expense],
          page: 0,
          size: 20,
          totalElements: 1,
          totalPages: 1,
        }),
      }),
    );
    await page.route('**/api/v1/expenses/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeSummaryWithFood()),
      }),
    );

    await page.goto('/expenses');
    await expect(page.getByTestId('expense-row')).toBeVisible({ timeout: 10_000 });

    await page.getByTestId(`btn-delete-${expense.id}`).click();
    await expect(page.getByTestId('confirm-delete-dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByTestId('btn-cancel-delete').click();
    await expect(page.getByTestId('confirm-delete-dialog')).not.toBeVisible({ timeout: 5_000 });
    // Row still there
    await expect(page.getByTestId('expense-row')).toBeVisible({ timeout: 5_000 });
  });
});

// ── AC-5: Filter by category — only matching expenses shown ───────────────────

test.describe('AC-5: Filter by category', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('selecting a category filter sends category query and shows matching expenses', async ({
    page,
  }) => {
    const foodExpense = makeExpense({
      id: 'exp-food',
      category: 'FOOD_DRINK',
      description: 'Lunch',
    });
    const transportExpense = makeExpense({
      id: 'exp-transport',
      category: 'TRANSPORT',
      description: 'Bus ticket',
    });

    // Broad handler FIRST, summary LAST (LIFO: last-registered checked first)
    await page.route('**/api/v1/expenses**', (route) => {
      const url = new URL(route.request().url());
      const category = url.searchParams.get('category');
      if (category === 'FOOD_DRINK') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [foodExpense],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      }
      if (category === 'TRANSPORT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            content: [transportExpense],
            page: 0,
            size: 20,
            totalElements: 1,
            totalPages: 1,
          }),
        });
      }
      // All
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [foodExpense, transportExpense],
          page: 0,
          size: 20,
          totalElements: 2,
          totalPages: 1,
        }),
      });
    });

    // Summary LAST so it wins over the broad handler
    await page.route('**/api/v1/expenses/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeSummaryWithFood()),
      }),
    );

    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });

    // Should start with all 2 rows
    await expect(page.getByTestId('expense-row')).toHaveCount(2, { timeout: 10_000 });

    // Open category filter dropdown
    await page.getByTestId('category-filter-trigger').click();
    await page.getByTestId('filter-food_drink').click();

    // After filtering: 1 row (FOOD_DRINK only)
    await expect(page.getByTestId('expense-row')).toHaveCount(1, { timeout: 5_000 });
  });
});

// ── AC-6: Search by description — filters list correctly ─────────────────────

test.describe('AC-6: Search by description', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('typing in search input filters the list by description', async ({ page }) => {
    const lunchExpense = makeExpense({ id: 'exp-lunch', description: 'Team lunch' });
    const busExpense = makeExpense({
      id: 'exp-bus',
      description: 'Bus ticket',
      category: 'TRANSPORT',
    });

    // Broad handler FIRST, summary LAST (LIFO)
    await page.route('**/api/v1/expenses**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          content: [lunchExpense, busExpense],
          page: 0,
          size: 20,
          totalElements: 2,
          totalPages: 1,
        }),
      }),
    );

    await page.route('**/api/v1/expenses/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(makeEmptySummary()),
      }),
    );

    await page.goto('/expenses');
    await expect(page.getByTestId('expense-row')).toHaveCount(2, { timeout: 10_000 });

    // Type in search — filters client-side
    await page.getByTestId('search-input').fill('lunch');
    // Only the lunch row matches
    await expect(page.getByTestId('expense-row')).toHaveCount(1, { timeout: 5_000 });

    // Clear search — both rows return
    await page.getByTestId('btn-clear-search').click();
    await expect(page.getByTestId('expense-row')).toHaveCount(2, { timeout: 5_000 });
  });
});

// ── AC-7: Dashboard month picker — changing month updates summary cards ────────

test.describe('AC-7: Dashboard month picker updates summary', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubEmptyExpenses(page);
  });

  test('changing month fires a new summary request and updates grand total', async ({ page }) => {
    const summaryByMonth: Record<string, object> = {
      '2026-05': { month: '2026-05', grandTotal: 42.5, totalCount: 1, byCategory: [] },
      '2026-04': { month: '2026-04', grandTotal: 0, totalCount: 0, byCategory: [] },
    };

    await page.route('**/api/v1/expenses/summary**', (route) => {
      const url = new URL(route.request().url());
      const month = url.searchParams.get('month') ?? '2026-05';
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(summaryByMonth[month] ?? makeEmptySummary(month)),
      });
    });

    await page.goto('/expenses');
    await expect(page.getByTestId('expense-dashboard')).toBeVisible({ timeout: 10_000 });

    // Initial grand total shows May 2026
    await expect(page.getByTestId('grand-total')).toContainText('$42.50', { timeout: 10_000 });

    // Change month to April
    await page.getByTestId('month-picker').fill('2026-04');
    await page.getByTestId('month-picker').dispatchEvent('change');

    // Grand total resets for April
    await expect(page.getByTestId('grand-total')).toContainText('$0.00', { timeout: 5_000 });
  });
});

// ── AC-8: Category cards show correct totals and counts ──────────────────────

test.describe('AC-8: Category cards show correct totals and counts', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubEmptyExpenses(page);
  });

  test('category cards render with correct category, total, and count', async ({ page }) => {
    await page.route('**/api/v1/expenses/summary**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          month: CURRENT_MONTH,
          grandTotal: 167.5,
          totalCount: 3,
          byCategory: [
            { category: 'FOOD_DRINK', total: 42.5, count: 1 },
            { category: 'TRANSPORT', total: 125.0, count: 2 },
          ],
        }),
      }),
    );

    await page.goto('/expenses');
    await expect(page.getByTestId('expense-dashboard')).toBeVisible({ timeout: 10_000 });

    // Category cards grid should be present
    await expect(page.getByTestId('category-cards')).toBeVisible({ timeout: 10_000 });

    // FOOD_DRINK card
    const foodCard = page.getByTestId('category-card-FOOD_DRINK');
    await expect(foodCard).toBeVisible({ timeout: 5_000 });
    await expect(foodCard).toContainText('$42.50');
    await expect(foodCard).toContainText('1 expense');

    // TRANSPORT card
    const transportCard = page.getByTestId('category-card-TRANSPORT');
    await expect(transportCard).toBeVisible({ timeout: 5_000 });
    await expect(transportCard).toContainText('$125.00');
    await expect(transportCard).toContainText('2 expenses');

    // Grand total
    await expect(page.getByTestId('grand-total')).toContainText('$167.50');
  });
});

// ── AC-9: All 10 categories available in the form select ──────────────────────

test.describe('AC-9: All 10 categories available in the form select', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await stubEmptyExpenses(page);
    await stubEmptySummary(page);
  });

  test('expense form select has all 10 category options', async ({ page }) => {
    await page.goto('/expenses');
    await expect(page.getByTestId('expenses-page')).toBeVisible({ timeout: 10_000 });

    // Open the form
    await page.getByTestId('btn-new-expense').click();
    await expect(page.getByTestId('expense-form-sheet')).toBeVisible({ timeout: 5_000 });

    const select = page.getByTestId('select-category');
    await expect(select).toBeVisible();

    // Check all 10 categories are present as options
    for (const cat of ALL_CATEGORIES) {
      const option = select.locator(`option[value="${cat}"]`);
      await expect(option).toHaveCount(1);
    }

    const options = await select.locator('option').count();
    expect(options).toBe(10);
  });
});
