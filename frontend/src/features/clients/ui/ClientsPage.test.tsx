import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { ClientsPage } from './ClientsPage';
import { ToastProvider } from '@/shared/ui/Toast';

function renderPage() {
  return render(
    <MemoryRouter>
      <ToastProvider>
        <ClientsPage />
      </ToastProvider>
    </MemoryRouter>,
  );
}

describe('ClientsPage', () => {
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

  it('opens the create modal when New client is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-new-client'));
    expect(screen.getByTestId('client-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /new client/i })).toBeInTheDocument();
  });

  it('closes the modal when Cancel is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-new-client'));
    await user.click(screen.getByTestId('btn-cancel'));
    await waitFor(() => {
      expect(screen.queryByTestId('client-modal')).not.toBeInTheDocument();
    });
  });

  it('create flow: opens modal, submits form, list refreshes', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    await user.click(screen.getByTestId('btn-new-client'));

    const modal = screen.getByTestId('client-modal');
    await user.type(within(modal).getByTestId('input-name'), 'Brand New Client');
    await user.type(within(modal).getByTestId('input-email'), 'brandnew@client.com');
    await user.click(within(modal).getByTestId('btn-submit'));

    await waitFor(() => {
      expect(screen.queryByTestId('client-modal')).not.toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByText('Brand New Client')).toBeInTheDocument();
    });
  });

  it('opens edit modal with existing client data when Edit is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const editButtons = screen.getAllByTestId('btn-edit');
    await user.click(editButtons[0]!);

    expect(screen.getByTestId('client-modal')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /edit client/i })).toBeInTheDocument();
    // name field should be pre-filled
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
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
          content: [{ id: 'p1', name: 'Page Client', email: 'pc@example.com', phone: null, address: null, createdAt: '', updatedAt: '' }],
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
          content: [{ id: `p${page}`, name: `Client Page ${page}`, email: `p${page}@example.com`, phone: null, address: null, createdAt: '', updatedAt: '' }],
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

  it('closes the edit modal when the X button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.queryByTestId('loading-indicator')).not.toBeInTheDocument());

    const editButtons = screen.getAllByTestId('btn-edit');
    await user.click(editButtons[0]!);
    expect(screen.getByTestId('client-modal')).toBeInTheDocument();

    await user.click(screen.getByTestId('modal-close'));
    await waitFor(() => {
      expect(screen.queryByTestId('client-modal')).not.toBeInTheDocument();
    });
  });
});
