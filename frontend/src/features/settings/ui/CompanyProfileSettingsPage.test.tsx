import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { resetMockCompanyProfile } from '@/mocks/handlers';
import { CompanyProfileSettingsPage } from './CompanyProfileSettingsPage';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  resetMockCompanyProfile();
  vi.clearAllMocks();
});

const WAIT = { timeout: 5000 };

function renderPage() {
  return render(
    <I18nextProvider i18n={i18n}>
      <CompanyProfileSettingsPage />
    </I18nextProvider>,
  );
}

describe('CompanyProfileSettingsPage', () => {
  it('renders the page', () => {
    renderPage();
    expect(screen.getByTestId('company-profile-settings-page')).toBeInTheDocument();
  });

  it('shows loading skeleton initially', () => {
    renderPage();
    expect(screen.getByTestId('company-profile-loading')).toBeInTheDocument();
  });

  it('renders form after loading', async () => {
    renderPage();
    await waitFor(
      () => expect(screen.getByTestId('company-profile-form')).toBeInTheDocument(),
      WAIT,
    );
  });

  it('pre-fills form with data from API', async () => {
    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({
          name: 'Acme Corp',
          email: 'acme@example.com',
          phone: '+1 555 000',
          address: '123 Main St',
          vatNumber: 'VAT123',
          iban: 'GB12',
          swiftBic: 'BARCGB22',
          bankName: 'Barclays',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ),
    );
    renderPage();
    await waitFor(() => expect(screen.getByTestId('input-name')).toBeInTheDocument(), WAIT);
    expect(screen.getByTestId('input-name')).toHaveValue('Acme Corp');
    expect(screen.getByTestId('input-email')).toHaveValue('acme@example.com');
  });

  it('shows success toast on save', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({
          name: 'My Co',
          email: '',
          phone: '',
          address: '',
          vatNumber: '',
          iban: '',
          swiftBic: '',
          bankName: '',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('input-name')).toBeInTheDocument(), WAIT);
    await user.click(screen.getByTestId('btn-save-company-profile'));
    await waitFor(() => expect(toast.success).toHaveBeenCalled(), WAIT);
    expect(toast.success).toHaveBeenCalledWith(expect.stringContaining('Company profile saved'));
  });

  it('shows error toast when API returns error on save', async () => {
    const { toast } = await import('sonner');
    server.use(
      http.get('/api/v1/settings/company', () =>
        HttpResponse.json({
          name: 'My Co',
          email: '',
          phone: '',
          address: '',
          vatNumber: '',
          iban: '',
          swiftBic: '',
          bankName: '',
          updatedAt: '2026-01-01T00:00:00Z',
        }),
      ),
      http.put('/api/v1/settings/company', () =>
        HttpResponse.json({ status: 500, detail: 'Server error' }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();
    await waitFor(() => expect(screen.getByTestId('input-name')).toBeInTheDocument(), WAIT);
    await user.click(screen.getByTestId('btn-save-company-profile'));
    await waitFor(() => expect(toast.error).toHaveBeenCalled(), WAIT);
  });
});
