import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { InvoiceSentBadge } from './InvoiceSentBadge';

function renderWithI18n(ui: React.ReactElement) {
  return render(<I18nextProvider i18n={i18n}>{ui}</I18nextProvider>);
}

describe('InvoiceSentBadge', () => {
  it('renders nothing when lastSentAt is null', () => {
    const { container } = renderWithI18n(<InvoiceSentBadge lastSentAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a badge when lastSentAt is non-null', () => {
    renderWithI18n(<InvoiceSentBadge lastSentAt="2026-05-13T20:55:00Z" />);
    expect(screen.getByTestId('invoice-sent-badge')).toBeInTheDocument();
  });

  it('badge text contains "Sent on"', () => {
    renderWithI18n(<InvoiceSentBadge lastSentAt="2026-05-13T20:55:00Z" />);
    expect(screen.getByTestId('invoice-sent-badge').textContent).toContain('Sent on');
  });

  it('badge text contains the formatted date', () => {
    renderWithI18n(<InvoiceSentBadge lastSentAt="2026-05-13T20:55:00Z" />);
    const badge = screen.getByTestId('invoice-sent-badge');
    // Should contain the year
    expect(badge.textContent).toContain('2026');
  });

  it('renders different dates correctly', () => {
    const { rerender } = renderWithI18n(<InvoiceSentBadge lastSentAt="2026-01-01T10:00:00Z" />);
    expect(screen.getByTestId('invoice-sent-badge')).toBeInTheDocument();

    rerender(
      <I18nextProvider i18n={i18n}>
        <InvoiceSentBadge lastSentAt="2026-12-31T23:59:00Z" />
      </I18nextProvider>,
    );
    expect(screen.getByTestId('invoice-sent-badge')).toBeInTheDocument();
  });
});
