import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ClientForm } from './ClientForm';
import { ApiError } from '@/shared/lib/http';

function setup(props?: Partial<React.ComponentProps<typeof ClientForm>>) {
  const onSubmit = vi.fn().mockResolvedValue(undefined);
  const onCancel = vi.fn();
  render(
    <ClientForm
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel };
}

describe('ClientForm', () => {
  it('renders all form fields', () => {
    setup();
    expect(screen.getByRole('textbox', { name: /name/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /phone/i })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /address/i })).toBeInTheDocument();
  });

  it('populates fields from initial values', () => {
    setup({
      initial: {
        id: '1',
        name: 'Acme',
        email: 'acme@example.com',
        phone: '+1 555 000',
        address: '1 Main St',
        createdAt: '',
        updatedAt: '',
      },
    });
    expect(screen.getByDisplayValue('Acme')).toBeInTheDocument();
    expect(screen.getByDisplayValue('acme@example.com')).toBeInTheDocument();
  });

  it('calls onSubmit with validated data when form is valid', async () => {
    const user = userEvent.setup();
    const { onSubmit } = setup();

    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test Corp');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@corp.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Corp', email: 'test@corp.com' }),
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
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'not-an-email');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/valid email/i)).toBeInTheDocument();
    });
  });

  it('maps CLIENT_EMAIL_TAKEN ApiError to email field error', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({ status: 409, code: 'CLIENT_EMAIL_TAKEN', detail: 'Email taken' }),
    );
    render(<ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'dup@example.com');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(screen.getByText(/email is already in use/i)).toBeInTheDocument();
    });
  });

  it('shows a generic server error for non-email ApiErrors', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(
      new ApiError({ status: 500, detail: 'Internal server error' }),
    );
    render(<ClientForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
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
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    await user.type(screen.getByRole('textbox', { name: /phone/i }), 'invalid-phone!');
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/phone may only contain/i)).toBeInTheDocument();
    });
  });

  it('shows address validation error when address exceeds 500 chars', async () => {
    const user = userEvent.setup();
    setup();
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'Test');
    await user.type(screen.getByRole('textbox', { name: /email/i }), 'test@example.com');
    // Use fireEvent.change to set a long value without typing char-by-char
    fireEvent.change(screen.getByRole('textbox', { name: /address/i }), {
      target: { value: 'A'.repeat(501) },
    });
    await user.click(screen.getByRole('button', { name: /save/i }));
    await waitFor(() => {
      expect(screen.getByText(/address must be at most/i)).toBeInTheDocument();
    });
  });

  it('uses Update as submit label when submitLabel prop is set', () => {
    setup({ submitLabel: 'Update' });
    expect(screen.getByRole('button', { name: /update/i })).toBeInTheDocument();
  });
});
