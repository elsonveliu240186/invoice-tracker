import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { I18nextProvider } from 'react-i18next';
import { server } from '@/mocks/server';
import { resetMockClients } from '@/mocks/handlers';
import { ClientsPage } from './ClientsPage';
import { ToastProvider } from '@/shared/ui/Toast';
import i18n from '@/shared/lib/i18n';

function renderPage() {
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <ClientsPage />
        </ToastProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('ClientsPage', () => {
  beforeEach(() => {
    resetMockClients();
  });

  it('renders the page heading and new client button', async () => {
    renderPage();
    expect(screen.getByRole('heading', { name: /clients/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('btn-new-client')).toBeInTheDocument();
  });

  it('renders the paginated client list from the API', async () => {
    renderPage();
    await waitFor(() => {
      expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument();
    });
    // Default handlers provide "Acme Corp" and "Globex"
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('shows empty state when no clients are returned', async () => {
    server.use(
      http.get('/api/v1/clients', () =>
        HttpResponse.json({ content: [], page: 0, size: 20, totalElements: 0, totalPages: 0 }),
      ),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('shows error message when the API fails', async () => {
    server.use(
      http.get('/api/v1/clients', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    renderPage();
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument();
    });
  });

  it('opens the create sheet when New client is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-new-client'));
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /new client/i })).toBeInTheDocument();
  });

  it('closes the sheet when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-new-client'));
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
    });
  });

  it('create flow: opens sheet, submits form, list refreshes', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-new-client'));

    const sheet = screen.getByTestId('client-form-sheet');
    await user.type(within(sheet).getByTestId('input-name'), 'Brand New Client');
    await user.type(within(sheet).getByTestId('input-email'), 'brandnew@client.com');
    await user.click(within(sheet).getByTestId('btn-submit'));

    await waitFor(() => {
      expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Brand New Client')).toBeInTheDocument();
    });
  });

  it('opens edit sheet with existing client data when Edit is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const editButtons = screen.getAllByTestId('btn-edit');
    await user.click(editButtons[0]!);

    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /edit client/i })).toBeInTheDocument();
    // name field should be pre-filled
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
  });

  it('submits edit form and updates client in the list', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const editButtons = screen.getAllByTestId('btn-edit');
    await user.click(editButtons[0]!);
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();

    // Clear and retype name
    const nameInput = screen.getByLabelText(/name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Acme Corp Updated');

    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument(), {
      timeout: 3000,
    });
  });

  it('closes the sheet when the X button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const editButtons = screen.getAllByTestId('btn-edit');
    await user.click(editButtons[0]!);
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();

    await user.click(screen.getByTestId('sheet-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
    });
  });

  it('delete requires confirmation: cancel does nothing', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const deleteButtons = screen.getAllByTestId('btn-delete');
    await user.click(deleteButtons[0]!);

    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();

    await user.click(screen.getByTestId('btn-cancel-delete'));
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
    });
    // Client should still be in the list
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('delete: confirm calls API and removes client from list', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const deleteButtons = screen.getAllByTestId('btn-delete');
    await user.click(deleteButtons[0]!);

    await user.click(screen.getByTestId('btn-confirm-delete'));

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.queryByText('Acme Corp')).not.toBeInTheDocument();
    });
  });

  it('search input updates the query and filters results', async () => {
    const user = userEvent.setup();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    fetchSpy.mockClear();
    await user.type(screen.getByTestId('search-input'), 'Acme');

    await waitFor(() => {
      const calls = fetchSpy.mock.calls as Array<[string, RequestInit]>;
      expect(calls.some(([url]) => String(url).includes('query=Acme'))).toBe(true);
    });

    fetchSpy.mockRestore();
  });

  it('shows pagination controls when there are multiple pages', async () => {
    server.use(
      http.get('/api/v1/clients', () =>
        HttpResponse.json({
          content: [
            {
              id: 'p1',
              name: 'Page Client',
              email: 'pc@example.com',
              phone: null,
              address: null,
              createdAt: '',
              updatedAt: '',
            },
          ],
          page: 0,
          size: 20,
          totalElements: 25,
          totalPages: 2,
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
    expect(screen.getByTestId('btn-next-page')).toBeInTheDocument();
    expect(screen.getByTestId('btn-prev-page')).toBeInTheDocument();
  });

  it('navigates to next and previous page', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    server.use(
      http.get('/api/v1/clients', ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page') ?? '0';
        callCount++;
        return HttpResponse.json({
          content: [
            {
              id: `p${page}`,
              name: `Client Page ${page}`,
              email: `p${page}@example.com`,
              phone: null,
              address: null,
              createdAt: '',
              updatedAt: '',
            },
          ],
          page: parseInt(page),
          size: 20,
          totalElements: 40,
          totalPages: 2,
        });
      }),
    );

    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    callCount = 0;
    await user.click(screen.getByTestId('btn-next-page'));
    await waitFor(() => expect(callCount).toBeGreaterThan(0));
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-prev-page'));
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());
  });

  it('shows toast and closes confirm dialog when delete API fails', async () => {
    server.use(
      http.delete('/api/v1/clients/:id', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );

    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const deleteButtons = screen.getAllByTestId('btn-delete');
    await user.click(deleteButtons[0]!);
    await user.click(screen.getByTestId('btn-confirm-delete'));

    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('toast')).toBeInTheDocument();
  });

  it('status filter: All shows all clients', async () => {
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    // Default "ALL" filter — both clients visible
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('status filter: Active shows only active clients', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('status-filter-trigger'));
    await user.click(screen.getByTestId('filter-active'));

    // Both default to ACTIVE (no status field on fixture), so both visible
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('status filter: Inactive shows only inactive clients', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('status-filter-trigger'));
    await user.click(screen.getByTestId('filter-inactive'));

    // Fixture clients have no status field → all derive to ACTIVE → none shown
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument();
    });
  });

  it('status filter trigger label updates when filter changes', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const trigger = screen.getByTestId('status-filter-trigger');
    expect(trigger).toHaveTextContent(/all/i);

    await user.click(trigger);
    await user.click(screen.getByTestId('filter-active'));

    expect(screen.getByTestId('status-filter-trigger')).toHaveTextContent(/active/i);
  });
<<<<<<< HEAD

  it('clear-button-appears: X button is visible when search is non-empty, hidden when empty', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    // Initially no clear button
    expect(screen.queryByTestId('btn-clear-search')).not.toBeInTheDocument();

    // Type something — clear button appears
    await user.type(screen.getByTestId('search-input'), 'Acme');
    expect(screen.getByTestId('btn-clear-search')).toBeInTheDocument();

    // Click clear — button disappears
    await user.click(screen.getByTestId('btn-clear-search'));
    expect(screen.queryByTestId('btn-clear-search')).not.toBeInTheDocument();
    expect(screen.getByTestId('search-input')).toHaveValue('');
  });

  it('Escape-clears: pressing Escape on the input clears the search state', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const input = screen.getByTestId('search-input');
    await user.type(input, 'Globex');
    expect(input).toHaveValue('Globex');

    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');
    expect(screen.queryByTestId('btn-clear-search')).not.toBeInTheDocument();
  });

  it('Reset-resets-all-state: Reset filters button clears search and status filter', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    // Set search and status filter
    await user.type(screen.getByTestId('search-input'), 'Acme');
    await user.click(screen.getByTestId('status-filter-trigger'));
    await user.click(screen.getByTestId('filter-active'));

    // Verify state changed
    expect(screen.getByTestId('search-input')).toHaveValue('Acme');
    expect(screen.getByTestId('status-filter-trigger')).toHaveTextContent(/active/i);

    // Reset all filters
    await user.click(screen.getByTestId('btn-reset-filters'));

    expect(screen.getByTestId('search-input')).toHaveValue('');
    expect(screen.getByTestId('status-filter-trigger')).toHaveTextContent(/all/i);
    expect(screen.queryByTestId('btn-clear-search')).not.toBeInTheDocument();
  });
=======
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
});
