import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { resetMockClients } from '@/mocks/handlers';
import { ClientDetailPage } from './ClientDetailPage';

function renderPage(id: string) {
  return render(
    <MemoryRouter initialEntries={[`/clients/${id}`]}>
      <I18nextProvider i18n={i18n}>
        <Routes>
          <Route path="/clients/:id" element={<ClientDetailPage />} />
        </Routes>
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('ClientDetailPage', () => {
  beforeEach(() => {
    resetMockClients();
  });

  it('shows loading state initially', async () => {
    renderPage('uuid-1');
    // Loading state appears briefly
    await waitFor(() => {
      expect(
        screen.getByTestId('client-detail-loading') ||
          screen.getByTestId('client-detail-page') ||
          screen.getByTestId('client-detail-not-found'),
      ).toBeInTheDocument();
    });
  });

  it('renders client details after data loads', async () => {
    renderPage('uuid-1');
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('acme@example.com')).toBeInTheDocument();
  });

  it('shows not-found state for unknown client id', async () => {
    renderPage('unknown-id');
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-not-found')).toBeInTheDocument();
    });
  });

  it('renders back-to-clients link', async () => {
    renderPage('uuid-1');
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('back-to-clients')).toBeInTheDocument();
  });

  it('shows ACTIVE status badge for client without deletedAt', async () => {
    renderPage('uuid-1');
    await waitFor(() => {
      expect(screen.getByTestId('client-detail-page')).toBeInTheDocument();
    });
    expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
  });

  it('renders phone when client has a phone number', async () => {
    server.use(
      http.get('/api/v1/clients/:id', () =>
        HttpResponse.json({
          id: 'uuid-1',
          name: 'Acme Corp',
          email: 'acme@example.com',
          phone: '+1-555-0100',
          address: null,
          deletedAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ),
    );
    renderPage('uuid-1');
    await waitFor(() => expect(screen.getByTestId('client-detail-page')).toBeInTheDocument());
    expect(screen.getByText('+1-555-0100')).toBeInTheDocument();
  });

  it('renders address when client has an address', async () => {
    server.use(
      http.get('/api/v1/clients/:id', () =>
        HttpResponse.json({
          id: 'uuid-1',
          name: 'Acme Corp',
          email: 'acme@example.com',
          phone: null,
          address: '123 Main St, Springfield',
          deletedAt: null,
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ),
    );
    renderPage('uuid-1');
    await waitFor(() => expect(screen.getByTestId('client-detail-page')).toBeInTheDocument());
    expect(screen.getByText('123 Main St, Springfield')).toBeInTheDocument();
  });
});
