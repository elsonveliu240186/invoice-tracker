import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { StatusBadge } from './StatusBadge';

function renderBadge(status: 'DRAFT' | 'SENT' | 'PAID') {
  return render(
    <I18nextProvider i18n={i18n}>
      <StatusBadge status={status} />
    </I18nextProvider>,
  );
}

describe('StatusBadge', () => {
  it('renders DRAFT badge with correct token class', () => {
    renderBadge('DRAFT');
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('--color-status-draft-bg');
    expect(badge.className).toContain('--color-status-draft-fg');
  });

  it('renders SENT badge with correct token class', () => {
    renderBadge('SENT');
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('--color-status-sent-bg');
    expect(badge.className).toContain('--color-status-sent-fg');
  });

  it('renders PAID badge with correct token class', () => {
    renderBadge('PAID');
    const badge = screen.getByTestId('status-badge');
    expect(badge.className).toContain('--color-status-paid-bg');
    expect(badge.className).toContain('--color-status-paid-fg');
  });

  it('renders translated label for DRAFT', () => {
    renderBadge('DRAFT');
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Draft');
  });

  it('renders translated label for SENT', () => {
    renderBadge('SENT');
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Sent');
  });

  it('renders translated label for PAID', () => {
    renderBadge('PAID');
    expect(screen.getByTestId('status-badge')).toHaveTextContent('Paid');
  });

  it('includes data-status attribute matching the status prop', () => {
    renderBadge('DRAFT');
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'DRAFT');
  });

  it('includes data-status="SENT" for sent invoices', () => {
    renderBadge('SENT');
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'SENT');
  });

  it('includes data-status="PAID" for paid invoices', () => {
    renderBadge('PAID');
    expect(screen.getByTestId('status-badge')).toHaveAttribute('data-status', 'PAID');
  });
});
