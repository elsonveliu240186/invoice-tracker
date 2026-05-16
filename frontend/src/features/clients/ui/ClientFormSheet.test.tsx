import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ClientFormSheet } from './ClientFormSheet';
<<<<<<< HEAD
import type { Client } from '../model/types';
import type { CreateClientInput } from '../model/schema';

const mockClient: Client = {
  id: 'uuid-1',
  name: 'Acme Corp',
  email: 'acme@example.com',
  phone: '555-1234',
  address: '123 Main St',
  companyName: 'Elson Veliu',
  companyAddress: 'Abedin Dino 2, Tirana, Albania',
  companyVatNumber: 'M21813035F',
  companyIban: 'AL6220511162009756CLPRCFEUR0',
  companySwiftBic: 'NCBAALTX',
  companyBankName: 'Banka Kombetare Tregtare',
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
=======

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
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
    renderSheet({ open: false });
    expect(screen.queryByTestId('client-form-sheet')).not.toBeInTheDocument();
  });

<<<<<<< HEAD
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
=======
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
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
});
