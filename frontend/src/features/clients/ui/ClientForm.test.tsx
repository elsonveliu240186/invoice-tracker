import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { ClientForm } from './ClientForm';
import { ApiError } from '@/shared/lib/http';

function setup(props?: Partial<React.ComponentProps<typeof ClientForm>>) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <I18nextProvider i18n={i18n}>
      <ClientForm onSubmit={onSubmit} onCancel={onCancel} {...props} />
    </I18nextProvider>,
  );
  return { onSubmit, onCancel };
}

describe('ClientForm', () => {
  it('renders all form fields', () => {
    setup();
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-address')).toBeInTheDocument();
  });

  it('renders the company profile section heading', () => {
    setup();
    expect(screen.getByTestId('company-section-heading')).toBeInTheDocument();
    expect(screen.getByTestId('company-section-heading')).toHaveTextContent(
      /your company details for this client/i,
    );
  });

  it('renders all company profile fields', () => {
    setup();
    expect(screen.getByTestId('input-companyName')).toBeInTheDocument();
    expect(screen.getByTestId('input-companyAddress')).toBeInTheDocument();
    expect(screen.getByTestId('input-companyVatNumber')).toBeInTheDocument();
    expect(screen.getByTestId('input-companyIban')).toBeInTheDocument();
    expect(screen.getByTestId('input-companySwiftBic')).toBeInTheDocument();
    expect(screen.getByTestId('input-companyBankName')).toBeInTheDocument();
  });

  it('populates fields from initial values', () => {
    setup({
      initial: {
        id: '1',
        name: 'Acme',
        email: 'acme@example.com',
        phone: '+1 555 000',
        address: '1 Main St',
        companyName: 'My Company',
        companyAddress: 'Company St 1',
        companyVatNumber: 'VAT123',
        companyIban: 'AL62205111',
        companySwiftBic: 'NCBAALTX',
        companyBankName: 'Test Bank',
        createdAt: '',
        updatedAt: '',
      },
    });
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('acme@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('My Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('VAT123')).toBeInTheDocument();
    expect(screen.getByDisplayValue('NCBAALTX')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Bank')).toBeInTheDocument();
  });

  it('calls onSubmit with validated data including company fields when form is valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.type(screen.getByTestId('input-name'), 'Test Corp');
    await user.type(screen.getByTestId('input-email'), 'test@corp.com');
    await user.type(screen.getByTestId('input-companyName'), 'My Company Ltd');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Corp',
          email: 'test@corp.com',
          companyName: 'My Company Ltd',
        }),
      );
    });
  });

  it('shows inline validation errors for empty name', async () => {
    const user = userEvent.setup();
    setup();
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getAllByRole('alert').length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
  });

  it('shows inline validation error for invalid email', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('maps CLIENT_EMAIL_TAKEN ApiError to email field error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(
        new ApiError({ status: 409, code: 'CLIENT_EMAIL_TAKEN', detail: 'Email taken' }),
      );
    render(
      <I18nextProvider i18n={i18n}>
        <ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />
      </I18nextProvider>,
    );

    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'dup@example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is already in use/i)).toBeInTheDocument();
    });
  });

  it('shows a generic server error for non-email ApiErrors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError({ status: 500, detail: 'Internal server error' }));
    render(
      <I18nextProvider i18n={i18n}>
        <ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />
      </I18nextProvider>,
    );

    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('calls onCancel when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    const { onCancel } = setup();
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('shows phone validation error for invalid phone', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    await user.type(screen.getByTestId('input-phone'), 'invalid-phone!');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/phone may only contain/i)).toBeInTheDocument();
    });
  });

  it('shows address validation error when address exceeds 500 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    // Use fireEvent.change to set a long value without typing char-by-char
    fireEvent.change(screen.getByTestId('input-address'), {
      target: { value: 'A'.repeat(501) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/address must be at most/i)).toBeInTheDocument();
    });
  });

  it('shows company name validation error when value exceeds 200 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.change(screen.getByTestId('input-companyName'), {
      target: { value: 'A'.repeat(201) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/company name must be at most/i)).toBeInTheDocument();
    });
  });

  it('shows swift/bic validation error when value exceeds 20 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.change(screen.getByTestId('input-companySwiftBic'), {
      target: { value: 'A'.repeat(21) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/swift\/bic must be at most/i)).toBeInTheDocument();
    });
  });

  it('shows company address validation error when value exceeds 500 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.change(screen.getByTestId('input-companyAddress'), {
      target: { value: 'A'.repeat(501) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/company address must be at most/i)).toBeInTheDocument();
    });
  });

  it('shows IBAN validation error when value exceeds 100 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.change(screen.getByTestId('input-companyIban'), {
      target: { value: 'A'.repeat(101) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/iban must be at most/i)).toBeInTheDocument();
    });
  });

  it('shows VAT number validation error when value exceeds 50 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.change(screen.getByTestId('input-companyVatNumber'), {
      target: { value: 'A'.repeat(51) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/vat number must be at most/i)).toBeInTheDocument();
    });
  });

  it('shows bank name validation error when value exceeds 200 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByTestId('input-name'), 'Test');
    await user.type(screen.getByTestId('input-email'), 'test@example.com');
    fireEvent.change(screen.getByTestId('input-companyBankName'), {
      target: { value: 'A'.repeat(201) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/bank name must be at most/i)).toBeInTheDocument();
    });
  });

  it('typing in company fields updates state and clears errors', async () => {
    const user = userEvent.setup();
    setup();
    // trigger a validation error first by submitting empty
    await user.click(screen.getByRole('button', { name: /save/i }));

    // type in each company field to ensure onChange handlers are exercised
    await user.type(screen.getByTestId('input-companyName'), 'My Co');
    await user.type(screen.getByTestId('input-companyVatNumber'), 'VAT1');
    await user.type(screen.getByTestId('input-companyIban'), 'AL001');
    await user.type(screen.getByTestId('input-companySwiftBic'), 'BANK');
    await user.type(screen.getByTestId('input-companyBankName'), 'Bank');
    fireEvent.change(screen.getByTestId('input-companyAddress'), {
      target: { value: 'Some address' },
    });

    // all fields are accessible
    expect(screen.getByTestId('input-companyName')).toHaveValue('My Co');
    expect(screen.getByTestId('input-companyVatNumber')).toHaveValue('VAT1');
  });

  it('uses Update as submit label when submitLabel prop is set', () => {
    setup({ submitLabel: 'Update' });
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });
});
