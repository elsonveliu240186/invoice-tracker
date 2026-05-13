import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { PasswordField } from './PasswordField';

function renderField(props = {}) {
  return render(
    <I18nextProvider i18n={i18n}>
      <PasswordField placeholder="Password" {...props} />
    </I18nextProvider>,
  );
}

describe('PasswordField', () => {
  it('renders with type=password by default', () => {
    renderField();
    const input = screen.getByPlaceholderText('Password');
    expect(input).toHaveAttribute('type', 'password');
  });

  it('toggles to type=text when show button is clicked', async () => {
    const user = userEvent.setup();
    renderField();
    const input = screen.getByPlaceholderText('Password');
    const toggleBtn = screen.getByRole('button', { name: /show password/i });

    await user.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');
  });

  it('toggles back to type=password on second click', async () => {
    const user = userEvent.setup();
    renderField();
    const input = screen.getByPlaceholderText('Password');
    const toggleBtn = screen.getByRole('button', { name: /show password/i });

    await user.click(toggleBtn);
    expect(input).toHaveAttribute('type', 'text');

    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    await user.click(hideBtn);
    expect(input).toHaveAttribute('type', 'password');
  });

  it('sets aria-pressed=false initially', () => {
    renderField();
    const btn = screen.getByRole('button', { name: /show password/i });
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('sets aria-pressed=true after toggle', async () => {
    const user = userEvent.setup();
    renderField();
    const btn = screen.getByRole('button', { name: /show password/i });
    await user.click(btn);
    const hideBtn = screen.getByRole('button', { name: /hide password/i });
    expect(hideBtn).toHaveAttribute('aria-pressed', 'true');
  });
});
