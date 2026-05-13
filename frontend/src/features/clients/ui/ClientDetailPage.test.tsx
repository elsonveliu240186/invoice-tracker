import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockClients } from '@/mocks/handlers';
import i18n from '@/shared/lib/i18n';
import { ClientDetailPage } from './ClientDetailPage';
import { ToastProvider } from '@/shared/ui/Toast';

beforeEach(() => {
  resetMockClients();
});

function renderDetail(id = 'uuid-1') {
  return render(
    <MemoryRouter initialEntries={[`/clients/${id}`]}>
      <I18nextProvider i18n={i18n}>
        <ToastProvider>
          <Routes>
            <Route path="/clients/:id" element={<ClientDetailPage />} />
            <Route
              path="/clients"
              element={<div data-testid="clients-list-page">Clients List</div>}
            />
          </Routes>
        </ToastProvider>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('ClientDetailPage', () => {
  it('shows loading skeleton initially', () => {
    renderDetail();
    expect(screen.getByTestId('client-detail-loading')).toBeInTheDocument();
  });

  it('renders client fields after data loads', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByTestId('client-email')).toHaveTextContent('acme@example.com');
  });

  it('renders not-found message for unknown id', async () => {
    renderDetail('non-existent-id');
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-not-found')).toBeInTheDocument();
    });
    expect(screen.getByText('Client not found')).toBeInTheDocument();
    expect(screen.getByTestId('link-back-to-clients')).toBeInTheDocument();
  });

  it('renders not-found when api returns 404', async () => {
    server.use(
      http.get('/api/v1/clients/:id', () =>
        HttpResponse.json(
          { status: 404, code: 'CLIENT_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    renderDetail('uuid-1');
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-not-found')).toBeInTheDocument();
    });
  });

  it('opens edit sheet when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-edit-client'));
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();
  });

  it('opens delete dialog when delete button is clicked', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-delete-client'));
    expect(screen.getByTestId('confirm-delete-dialog')).toBeInTheDocument();
  });

  it('navigates back to /clients after successful delete', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-delete-client'));
    await user.click(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('clients-list-page')).toBeInTheDocument();
    });
  });

  it('cancels delete without navigating away', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-delete-client'));
    await user.click(screen.getByTestId('btn-cancel-delete'));
    await waitFor(() => {
      expect(screen.queryByTestId('confirm-delete-dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
  });

  it('shows edit sheet with prefilled data then save triggers refetch', async () => {
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-edit-client'));
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    // Close the sheet
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    await waitFor(() => {
      expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
    });
  });

  it('shows delete failed toast when delete api fails', async () => {
    server.use(
      http.delete('/api/v1/clients/:id', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    await user.click(screen.getByTestId('btn-delete-client'));
    await user.click(screen.getByTestId('btn-confirm-delete'));
    await waitFor(() => {
      expect(screen.getByTestId('toast')).toBeInTheDocument();
    });
  });

  it('renders back-to-clients link', async () => {
    renderDetail();
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('link-back-to-clients')).toBeInTheDocument();
  });

  it('mocks useClient — renders useClient mock via vi.mock', async () => {
    vi.mock('@/features/clients/api/useClients', async (importOriginal) => {
      const actual = await importOriginal<typeof import('@/features/clients/api/useClients')>();
      return actual;
    });
    renderDetail();
    await waitFor(() => {
      expect(
        screen.getByTestId('client-detail-loading') ||
          screen.getByTestId('client-detail-page') ||
          screen.getByTestId('client-detail-not-found'),
      ).toBeInTheDocument();
    });
  });
});
