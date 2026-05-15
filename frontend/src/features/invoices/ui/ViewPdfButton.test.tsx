import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ViewPdfButton } from './ViewPdfButton';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('ViewPdfButton', () => {
  it('renders the View PDF button', () => {
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    expect(screen.getByTestId('btn-view-pdf')).toBeInTheDocument();
  });

  it('does not show dialog initially', () => {
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    expect(screen.queryByTestId('pdf-dialog')).not.toBeInTheDocument();
  });

  it('opens dialog when button is clicked', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    await user.click(screen.getByTestId('btn-view-pdf'));
    expect(screen.getByTestId('pdf-dialog')).toBeInTheDocument();
  });

  it('iframe has correct src pointing at the API PDF url', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    await user.click(screen.getByTestId('btn-view-pdf'));
    const iframe = screen.getByTestId('pdf-iframe');
    expect(iframe).toHaveAttribute('src', '/api/v1/invoices/inv-uuid-1/pdf');
  });

  it('"Open in new tab" anchor has target=_blank and rel=noopener noreferrer', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    await user.click(screen.getByTestId('btn-view-pdf'));
    const link = screen.getByTestId('link-open-in-new-tab');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('"Open in new tab" anchor href points at PDF url', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    await user.click(screen.getByTestId('btn-view-pdf'));
    const link = screen.getByTestId('link-open-in-new-tab');
    expect(link).toHaveAttribute('href', '/api/v1/invoices/inv-uuid-1/pdf');
  });

  it('iframe has sandbox attribute set to allow-same-origin', async () => {
    const user = userEvent.setup();
    renderWithI18n(<ViewPdfButton invoiceId="inv-uuid-1" invoiceNumber="INV-2026-0001" />);
    await user.click(screen.getByTestId('btn-view-pdf'));
    expect(screen.getByTestId('pdf-iframe')).toHaveAttribute('sandbox', 'allow-same-origin');
  });
});
