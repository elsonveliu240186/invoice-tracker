import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { LanguageSelector } from './LanguageSelector';

function renderSelector() {
  return render(
    <I18nextProvider i18n={i18n}>
      <LanguageSelector />
    </I18nextProvider>,
  );
}

describe('LanguageSelector', () => {
  it('renders a button with aria-label Language', () => {
    renderSelector();
    expect(screen.getByRole('button', { name: /language/i })).toBeInTheDocument();
  });

  it('opens dropdown with English option', async () => {
    const user = userEvent.setup();
    renderSelector();
    await user.click(screen.getByRole('button', { name: /language/i }));
    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('calls i18n.changeLanguage("en") when English is clicked', async () => {
    const user = userEvent.setup();
    const changeLanguageSpy = vi.spyOn(i18n, 'changeLanguage');
    renderSelector();
    await user.click(screen.getByRole('button', { name: /language/i }));
    await user.click(screen.getByText('English'));
    expect(changeLanguageSpy).toHaveBeenCalledWith('en');
    changeLanguageSpy.mockRestore();
  });

  it('shows check mark next to active language', async () => {
    const user = userEvent.setup();
    renderSelector();
    await user.click(screen.getByRole('button', { name: /language/i }));

    const englishItem = screen.getByText('English').closest('[role="menuitem"]');
    // Check icon should be present as a sibling svg
    expect(englishItem?.querySelector('svg')).toBeTruthy();
  });
});
