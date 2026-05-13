import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { LoadingSpinner } from './LoadingSpinner';

function renderSpinner(props = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <LoadingSpinner {...props} />
    </I18nextProvider>,
  );
}

describe('LoadingSpinner', () => {
  it('renders with role status', () => {
    renderSpinner();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('has a localized aria-label', () => {
    renderSpinner();
    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'Loading…');
  });

  it('applies sm size class', () => {
    renderSpinner({ size: 'sm' });
    expect(screen.getByRole('status')).toHaveClass('h-4', 'w-4');
  });

  it('applies md size class by default', () => {
    renderSpinner();
    expect(screen.getByRole('status')).toHaveClass('h-6', 'w-6');
  });

  it('applies lg size class', () => {
    renderSpinner({ size: 'lg' });
    expect(screen.getByRole('status')).toHaveClass('h-10', 'w-10');
  });

  it('accepts additional className', () => {
    renderSpinner({ className: 'custom-class' });
    expect(screen.getByRole('status')).toHaveClass('custom-class');
  });
});
