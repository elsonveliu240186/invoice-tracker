import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ThemeToggle } from './ThemeToggle';

describe('ThemeToggle (static import — coverage)', () => {
  it('renders the theme toggle button', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <ThemeToggle />
      </I18nextProvider>,
    );
    expect(screen.getByRole('button', { name: /theme/i })).toBeInTheDocument();
  });
});
