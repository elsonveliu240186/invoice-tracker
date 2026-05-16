import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ClientTable } from './ClientTable';
import type { Client } from '../model/types';

const clients: Client[] = [
  {
    id: 'uuid-1',
    name: 'Acme Corp',
    email: 'acme@example.com',
    phone: '+1 555 000',
    address: '1 Main St',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
  },
  {
    id: 'uuid-2',
    name: 'Globex',
    email: 'globex@example.com',
    phone: null,
    address: null,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z',
  },
];

function renderTable(props: Partial<React.ComponentProps<typeof ClientTable>> = {}) {
  const onEdit = vi.fn();
  const onDelete = vi.fn();
  render(
    <MemoryRouter>
      <I18nextProvider i18n={i18n}>
        <ClientTable clients={clients} onEdit={onEdit} onDelete={onDelete} {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );
  return { onEdit, onDelete };
}

describe('ClientTable', () => {
  it('renders all client rows', () => {
    renderTable();
    expect(screen.getAllByTestId('client-row')).toHaveLength(2);
  });

  it('renders client name and email columns', () => {
    renderTable();
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
    expect(screen.getByText('acme@example.com')).toBeInTheDocument();
    expect(screen.getByText('Globex')).toBeInTheDocument();
  });

  it('renders Status column header', () => {
    renderTable();
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('renders Updated column header', () => {
    renderTable();
    expect(screen.getByText('Updated')).toBeInTheDocument();
  });

  it('renders status badge for each row', () => {
    renderTable();
    const badges = screen.getAllByTestId('status-badge');
    expect(badges).toHaveLength(2);
    // Both default to ACTIVE since no status field on Client type
    expect(badges[0]).toHaveAttribute('data-variant', 'success');
  });

  it('renders formatted updatedAt date for each row', () => {
    renderTable();
    // 2024-01-02 in any locale will contain "2024"
    const rows = screen.getAllByTestId('client-row');
    expect(rows[0]).toHaveTextContent('2024');
  });

  it('renders empty state when no clients', () => {
    renderTable({ clients: [] });
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    const { onEdit } = renderTable();
    const editButtons = screen.getAllByTestId('btn-edit');
    await user.click(editButtons[0]!);
    expect(onEdit).toHaveBeenCalledWith(clients[0]);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    const { onDelete } = renderTable();
    const deleteButtons = screen.getAllByTestId('btn-delete');
    await user.click(deleteButtons[0]!);
    expect(onDelete).toHaveBeenCalledWith(clients[0]);
  });

  it('renders phone dash when phone is null', () => {
    renderTable();
    // Globex has null phone
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('renders the table with correct testid', () => {
    renderTable();
    expect(screen.getByTestId('clients-table')).toBeInTheDocument();
  });
});
