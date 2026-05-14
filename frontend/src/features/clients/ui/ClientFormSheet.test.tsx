import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ClientFormSheet } from './ClientFormSheet';
import type { Client } from '../model/types';
import type { CreateClientInput } from '../model/schema';

const mockClient: Client = {
  id: 'uuid-1',
  name: 'Acme Corp',
  email: 'acme@example.com',
  phone: '555-1234',
  address: '123 Main St',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  deletedAt: null,
};

const noopSubmit = (_data: CreateClientInput): Promise<void> => Promise.resolve();

function renderSheet(props: {
  open: boolean;
  onClose?: () => void;
  onSubmit?: (data: CreateClientInput) => Promise<void>;
  editingClient?: Client | null;
}) {
  const onClose = props.onClose ?? vi.fn();
  const onSubmit = props.onSubmit ?? noopSubmit;
  return render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ClientFormSheet
          open={props.open}
          onClose={onClose}
          onSubmit={onSubmit}
          editingClient={props.editingClient ?? null}
        />
      </I18nextProvider>
    </MemoryRouter>,
  );
}

describe('ClientFormSheet', () => {
  it('renders nothing when closed', () => {
    renderSheet({ open: false });
    expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
  });

  it('renders the sheet with "New client" heading when open with no editingClient', () => {
    renderSheet({ open: true });
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /new client/i })).toBeInTheDocument();
  });

  it('renders the sheet with "Edit client" heading when editing', () => {
    renderSheet({ open: true, editingClient: mockClient });
    expect(screen.getByTestId('client-form-sheet')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /edit client/i })).toBeInTheDocument();
  });

  it('pre-fills form fields with editingClient data', () => {
    renderSheet({ open: true, editingClient: mockClient });
    expect(screen.getByDisplayValue('Acme Corp')).toBeInTheDocument();
    expect(screen.getByDisplayValue('acme@example.com')).toBeInTheDocument();
  });

  it('calls onClose when the X button is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSheet({ open: true, onClose });
    await user.click(screen.getByTestId('sheet-close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Cancel is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSheet({ open: true, onClose });
    await user.click(screen.getByTestId('btn-cancel'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    renderSheet({ open: true, onClose });
    await user.click(screen.getByTestId('sheet-backdrop'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onSubmit with valid data when form is submitted', async () => {
    const onSubmit = vi.fn((_data: CreateClientInput): Promise<void> => Promise.resolve());
    const user = userEvent.setup();
    renderSheet({ open: true, onSubmit });

    await user.clear(screen.getByTestId('input-name'));
    await user.type(screen.getByTestId('input-name'), 'New Client');
    await user.clear(screen.getByTestId('input-email'));
    await user.type(screen.getByTestId('input-email'), 'new@client.com');
    await user.click(screen.getByTestId('btn-submit'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Client', email: 'new@client.com' }),
      );
    });
  });
});
