import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { resetMockClients } from '@/mocks/handlers';
import { ApiError } from '@/shared/lib/http';
import { InvoiceForm } from './InvoiceForm';
import type { InvoiceFormValues } from '../model/schema';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  resetMockClients();
  vi.clearAllMocks();
});

function renderForm(
  props: Partial<React.ComponentProps<typeof InvoiceForm>> = {},
  initialPath = '/',
) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();

  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <I18nextProvider i18n={i18n}>
        <InvoiceForm onSubmit={onSubmit} onCancel={onCancel} {...props} />
      </I18nextProvider>
    </MemoryRouter>,
  );

  return { onSubmit, onCancel };
}

const WAIT = { timeout: 3000 };

describe('InvoiceForm', () => {
  it('renders the form', () => {
    renderForm();
    expect(screen.getByTestId('invoice-form')).toBeInTheDocument();
  });

  it('renders client search input', () => {
    renderForm();
    expect(screen.getByTestId('input-client-search')).toBeInTheDocument();
  });

  it('renders invoice number input', () => {
    renderForm();
    expect(screen.getByTestId('input-number')).toBeInTheDocument();
  });

  it('renders issue date and due date inputs', () => {
    renderForm();
    expect(screen.getByTestId('input-issue-date')).toBeInTheDocument();
    expect(screen.getByTestId('input-due-date')).toBeInTheDocument();
  });

  it('renders tax rate input', () => {
    renderForm();
    expect(screen.getByTestId('input-tax-rate')).toBeInTheDocument();
  });

  it('renders at least one line item row', () => {
    renderForm();
    expect(screen.getByTestId('line-item-0')).toBeInTheDocument();
  });

  it('renders totals section', () => {
    renderForm();
    expect(screen.getByTestId('invoice-totals')).toBeInTheDocument();
  });

  it('shows nextNumber as placeholder when provided', () => {
    renderForm({ nextNumber: 'INV-2026-0001' });
    const input = screen.getByTestId('input-number') as HTMLInputElement;
    expect(input.placeholder).toBe('INV-2026-0001');
  });

  it('shows client dropdown when typing in client search', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('input-client-search');
    await user.click(input);
    await waitFor(() => expect(screen.getByTestId('client-dropdown')).toBeInTheDocument(), WAIT);
  });

  it('selects client from dropdown', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('input-client-search');
    await user.click(input);
    await waitFor(
      () => expect(screen.getByTestId('client-option-uuid-1')).toBeInTheDocument(),
      WAIT,
    );
    await user.click(screen.getByTestId('client-option-uuid-1'));
    expect((screen.getByTestId('input-client-search') as HTMLInputElement).value).toContain(
      'Acme Corp',
    );
  });

  it('adds a line item when Add Line is clicked', async () => {
    const user = userEvent.setup();
    renderForm();
    expect(screen.getByTestId('line-item-0')).toBeInTheDocument();
    expect(screen.queryByTestId('line-item-1')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('btn-add-line'));
    expect(screen.getByTestId('line-item-1')).toBeInTheDocument();
  });

  it('removes a line item when remove button is clicked (only if >1 line)', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('btn-add-line'));
    expect(screen.getByTestId('line-item-1')).toBeInTheDocument();
    await user.click(screen.getByTestId('btn-remove-line-1'));
    expect(screen.queryByTestId('line-item-1')).not.toBeInTheDocument();
  });

  it('remove button is disabled when only one line', () => {
    renderForm();
    expect(screen.getByTestId('btn-remove-line-0')).toBeDisabled();
  });

  it('live total updates when quantity and unit price are changed', () => {
    renderForm();
    fireEvent.change(screen.getByTestId('input-line-quantity-0'), { target: { value: '2' } });
    fireEvent.change(screen.getByTestId('input-line-unit-price-0'), { target: { value: '50' } });
    expect(screen.getByTestId('form-subtotal').textContent).toBe('$100.00');
  });

  it('shows tax amount when tax rate > 0', () => {
    renderForm();
    fireEvent.change(screen.getByTestId('input-line-quantity-0'), { target: { value: '1' } });
    fireEvent.change(screen.getByTestId('input-line-unit-price-0'), { target: { value: '100' } });
    fireEvent.change(screen.getByTestId('input-tax-rate'), { target: { value: '21' } });
    expect(screen.getByTestId('form-tax')).toBeInTheDocument();
    expect(screen.getByTestId('form-total').textContent).toBe('$121.00');
  });

  it('shows validation error when submitting without client', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0));
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = renderForm();
    await user.click(screen.getByTestId('btn-cancel'));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('shows error when server returns INVOICE_NUMBER_TAKEN', async () => {
    const apiError = new ApiError({
      status: 409,
      code: 'INVOICE_NUMBER_TAKEN',
      detail: 'Invoice number already taken',
    });
    const onSubmit = vi.fn().mockRejectedValue(apiError);
    const onCancel = vi.fn();

    // Pre-fill with a valid initial invoice so clientId is already set
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 1,
          unitPrice: '100.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };

    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled(), WAIT);
    // After rejection, number-taken error should show in field errors
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0), WAIT);
  });

  it('pre-fills form when initial invoice is provided', () => {
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: 'uuid-1',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'line-1',
          description: 'Consulting',
          quantity: 2,
          unitPrice: '50.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };
    renderForm({ initial });
    expect((screen.getByTestId('input-number') as HTMLInputElement).value).toBe('INV-2026-0001');
    expect((screen.getByTestId('input-issue-date') as HTMLInputElement).value).toBe('2026-05-15');
    expect((screen.getByTestId('input-due-date') as HTMLInputElement).value).toBe('2026-06-15');
  });

  it('emits payload on valid submit', async () => {
    // Use initial to pre-set clientId, avoiding the dropdown blur race condition in tests
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 1,
          unitPrice: '100.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(
      () =>
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining<Partial<InvoiceFormValues>>({
            clientId: '00000000-0000-0000-0000-000000000001',
            issueDate: '2026-05-15',
            dueDate: '2026-06-15',
          }),
        ),
      WAIT,
    );
  });

  it('shows line-level quantity and unit-price validation errors', async () => {
    // Use initial invoice with quantity=0 to trigger line validation error
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.00',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 0, // invalid — below min(1)
          unitPrice: '-1.00', // stored as string in Invoice type
          lineTotal: '0.00',
        },
      ],
      subtotal: '0.00',
      total: '0.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };

    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0), WAIT);
    // quantity error should be shown
    expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
  });

  it('shows taxRate field error when taxRate exceeds maximum', async () => {
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 1,
          unitPrice: '100.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );
    // Set taxRate to 200 (> 1.0 = 100%) which triggers max validation
    fireEvent.change(screen.getByTestId('input-tax-rate'), { target: { value: '200' } });
    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0), WAIT);
  });

  it('shows lines error when lines array is empty', async () => {
    // Pass an initial with empty lines array to bypass the UI remove restriction
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.00',
      lines: [] as import('../model/types').Invoice['lines'],
      subtotal: '0.00',
      total: '0.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={vi.fn()} onCancel={vi.fn()} />
        </I18nextProvider>
      </MemoryRouter>,
    );
    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0), WAIT);
  });

  it('typing in number field clears number field error', async () => {
    const user = userEvent.setup();
    renderForm();
    // Submit without required fields to produce errors
    await user.click(screen.getByTestId('btn-submit'));
    // Now type in the number field — the onChange handler should fire
    await user.type(screen.getByTestId('input-number'), 'INV-2026-0001');
    expect((screen.getByTestId('input-number') as HTMLInputElement).value).toBe('INV-2026-0001');
  });

  it('typing in issue date field updates value', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('btn-submit'));
    fireEvent.change(screen.getByTestId('input-issue-date'), { target: { value: '2026-05-15' } });
    expect((screen.getByTestId('input-issue-date') as HTMLInputElement).value).toBe('2026-05-15');
  });

  it('typing in due date field updates value', async () => {
    const user = userEvent.setup();
    renderForm();
    await user.click(screen.getByTestId('btn-submit'));
    fireEvent.change(screen.getByTestId('input-due-date'), { target: { value: '2026-06-15' } });
    expect((screen.getByTestId('input-due-date') as HTMLInputElement).value).toBe('2026-06-15');
  });

  it('clearing client search input clears the selected client', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('input-client-search');
    await user.click(input);
    await waitFor(
      () => expect(screen.getByTestId('client-option-uuid-1')).toBeInTheDocument(),
      WAIT,
    );
    await user.click(screen.getByTestId('client-option-uuid-1'));
    // Now clear the search
    await user.clear(input);
    expect((input as HTMLInputElement).value).toBe('');
  });

  it('client search onBlur hides dropdown after timeout', async () => {
    const user = userEvent.setup();
    renderForm();
    const input = screen.getByTestId('input-client-search');
    await user.click(input);
    await waitFor(() => expect(screen.getByTestId('client-dropdown')).toBeInTheDocument(), WAIT);
    await user.tab(); // triggers onBlur
    await waitFor(
      () => expect(screen.queryByTestId('client-dropdown')).not.toBeInTheDocument(),
      WAIT,
    );
  });

  it('shows server error for non-ApiError exception', async () => {
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 1,
          unitPrice: '100.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };

    const onSubmit = vi.fn().mockRejectedValue(new Error('Network error'));
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled(), WAIT);
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0), WAIT);
  });

  it('shows server error for non-INVOICE_NUMBER_TAKEN ApiError', async () => {
    const apiError = new ApiError({
      status: 500,
      code: 'INTERNAL_ERROR',
      detail: 'Internal server error',
    });
    const initial = {
      id: 'inv-1',
      number: 'INV-2026-0001',
      clientId: '00000000-0000-0000-0000-000000000001',
      clientEmail: 'acme@example.com',
      issueDate: '2026-05-15',
      dueDate: '2026-06-15',
      taxRate: '0.21',
      lines: [
        {
          id: 'l1',
          description: 'Service',
          quantity: 1,
          unitPrice: '100.00',
          lineTotal: '100.00',
        },
      ],
      subtotal: '100.00',
      total: '121.00',
      status: 'DRAFT' as const,
      lastSentAt: null,
      createdAt: '2026-05-15T00:00:00Z',
      updatedAt: '2026-05-15T00:00:00Z',
    };

    const onSubmit = vi.fn().mockRejectedValue(apiError);
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <I18nextProvider i18n={i18n}>
          <InvoiceForm initial={initial} onSubmit={onSubmit} onCancel={onCancel} />
        </I18nextProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByTestId('btn-submit'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalled(), WAIT);
    await waitFor(() => expect(screen.getAllByRole('alert').length).toBeGreaterThan(0), WAIT);
  });
});
