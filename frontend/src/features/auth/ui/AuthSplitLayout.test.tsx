import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { AuthSplitLayout } from './AuthSplitLayout';

function renderLayout(children = <p>Form content</p>) {
  return render(
    <I18nextProvider i18n={i18n}>
      <AuthSplitLayout>{children}</AuthSplitLayout>
    </I18nextProvider>,
  );
}

describe('AuthSplitLayout', () => {
  it('renders children', () => {
    renderLayout(<p>Test form</p>);
    expect(screen.getByText('Test form')).toBeInTheDocument();
  });

  it('renders brand panel with md: classes (hidden on mobile, shown on md+)', () => {
    renderLayout();
    const brandPanel = screen.getByTestId('brand-panel');
    expect(brandPanel).toBeInTheDocument();
    expect(brandPanel.className).toContain('md:flex');
    expect(brandPanel.className).toContain('hidden');
  });

  it('renders app name in brand panel', () => {
    renderLayout();
    expect(screen.getByText('Invoice Tracker')).toBeInTheDocument();
  });

  it('renders the brand tagline', () => {
    renderLayout();
    expect(screen.getByText('Manage invoices with ease')).toBeInTheDocument();
  });
});
