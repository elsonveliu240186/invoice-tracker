import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ClientFormSheet } from './ClientFormSheet';

function renderSheet(props: Partial<React.ComponentProps<typeof ClientFormSheet>> = {}) {
  const onClose = vi.fn();
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ClientFormSheet open={true} onClose={onClose} onSubmit={onSubmit} {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
  return { onClose, onSubmit };
}

describe('ClientFormSheet', () => {
  it('renders the sheet when open=true', () => {
    renderSheet({ open: true });
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();
  });

  it('does not render the form when open=false', () => {
    renderSheet({ open: false });
    expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
  });

  it('shows "New client" title when no editingClient', () => {
    renderSheet({ editingClient: null });
    expect(screen.getByText('New client')).toBeInTheDocument();
  });

  it('shows "Edit client" title when editingClient is provided', () => {
    renderSheet({
      editingClient: {
        id: 'uuid-1',
        name: 'Acme',
        email: 'acme@example.com',
        phone: null,
        address: null,
        createdAt: '',
        updatedAt: '',
      },
    });
    expect(screen.getByText('Edit client')).toBeInTheDocument();
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet({ open: true, editingClient: null });
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when sheet close button is clicked', async () => {
    const user = userEvent.setup();
    const { onClose } = renderSheet({ open: true });
    await user.click(screen.getByTestId('sheet-close'));
    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls onSubmit when form is submitted with valid data', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderSheet({ open: true, editingClient: null });
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'New Corp');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'new@corp.com');
    await user.click(screen.getByRole('button', { name: /create/i }));
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Corp', email: 'new@corp.com' }),
      );
    });
  });

  it('pre-fills form with editingClient data', () => {
    renderSheet({
      editingClient: {
        id: 'uuid-1',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: null,
        address: null,
        createdAt: '',
        updatedAt: '',
      },
    });
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('acme@example.com')).toBeInTheDocument();
  });
});
