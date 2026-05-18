import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { CompanyProfileForm } from './CompanyProfileForm';

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function renderForm(props: Partial<Parameters<typeof CompanyProfileForm>[0]> = {}) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const result = render(
    <I18nextProvider i18n={i18n}>
      <CompanyProfileForm onSubmit={onSubmit} {...props} />
    </I18nextProvider>,
  );
  return { ...result, onSubmit };
}

describe('CompanyProfileForm', () => {
  it('renders all 8 input fields', () => {
    renderForm();
    expect(screen.getByTestId('input-name')).toBeInTheDocument();
    expect(screen.getByTestId('input-email')).toBeInTheDocument();
    expect(screen.getByTestId('input-phone')).toBeInTheDocument();
    expect(screen.getByTestId('input-address')).toBeInTheDocument();
    expect(screen.getByTestId('input-vatNumber')).toBeInTheDocument();
    expect(screen.getByTestId('input-iban')).toBeInTheDocument();
    expect(screen.getByTestId('input-swiftBic')).toBeInTheDocument();
    expect(screen.getByTestId('input-bankName')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderForm();
    expect(screen.getByTestId('btn-save-company-profile')).toBeInTheDocument();
  });

  it('pre-fills fields with defaultValues', () => {
    renderForm({
      defaultValues: {
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: '+1 555 123 4567',
        address: '123 Main St',
        vatNumber: 'VAT123',
        iban: 'GB12BARC20201530093459',
        swiftBic: 'BARCGB22',
        bankName: 'Barclays',
      },
    });
    expect(screen.getByTestId('input-name')).toHaveValue('Acme Corp');
    expect(screen.getByTestId('input-email')).toHaveValue('acme@example.com');
    expect(screen.getByTestId('input-vatNumber')).toHaveValue('VAT123');
    expect(screen.getByTestId('input-iban')).toHaveValue('GB12BARC20201530093459');
    expect(screen.getByTestId('input-swiftBic')).toHaveValue('BARCGB22');
    expect(screen.getByTestId('input-bankName')).toHaveValue('Barclays');
  });

  it('calls onSubmit with form values on valid submit', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm();
    await user.clear(screen.getByTestId('input-name'));
    await user.type(screen.getByTestId('input-name'), 'My Company');
    await user.click(screen.getByTestId('btn-save-company-profile'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    const callArg = onSubmit.mock.calls[0]?.[0] as Record<string, string> | undefined;
    expect(callArg?.name).toBe('My Company');
  });

  it('shows validation error when name is blank', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ defaultValues: { name: '' } });
    await user.click(screen.getByTestId('btn-save-company-profile'));
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows validation error when email is invalid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = renderForm({ defaultValues: { name: 'My Co' } });
    await user.type(screen.getByTestId('input-email'), 'not-an-email');
    await user.click(screen.getByTestId('btn-save-company-profile'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toBeInTheDocument(),
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('disables all inputs and submit button while submitting', async () => {
    let resolveSubmit!: () => void;
    const pendingPromise = new Promise<void>((res) => {
      resolveSubmit = res;
    });
    const user = userEvent.setup();
    renderForm({
      defaultValues: { name: 'My Co' },
      onSubmit: () => pendingPromise,
    });
    await user.click(screen.getByTestId('btn-save-company-profile'));
    await waitFor(() =>
      expect(screen.getByTestId('btn-save-company-profile')).toBeDisabled(),
    );
    expect(screen.getByTestId('input-name')).toBeDisabled();
    resolveSubmit();
  });
});
