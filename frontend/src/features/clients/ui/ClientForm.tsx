import { useState } from 'react';
import { createClientSchema, type CreateClientInput } from '../model/schema';
import type { Client } from '../model/types';
import { ApiError } from '@/shared/lib/http';
import { Input } from '@/shared/ui/input';
import { Button } from '@/shared/ui/button';

interface ClientFormProps {
  initial?: Partial<Client> | undefined;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string | undefined;
}

type FieldErrors = Partial<Record<keyof CreateClientInput, string>>;

export function ClientForm({ initial, onSubmit, onCancel, submitLabel = 'Save' }: ClientFormProps) {
  const [values, setValues] = useState<CreateClientInput>({
    name: initial?.name ?? '',
    email: initial?.email ?? '',
    phone: initial?.phone ?? '',
    address: initial?.address ?? '',
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(field: keyof CreateClientInput, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const result = createClientSchema.safeParse(values);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof CreateClientInput | undefined;
        if (key) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setSubmitting(true);
    setServerError(null);
    try {
      await onSubmit(result.data);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'CLIENT_EMAIL_TAKEN') {
          setFieldErrors((prev) => ({ ...prev, email: 'This email is already in use' }));
        } else {
          setServerError(err.detail ?? err.message);
        }
      } else {
        setServerError('An unexpected error occurred');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={(e) => {
        void handleSubmit(e);
      }}
      noValidate
      data-testid="client-form"
    >
      {serverError && (
        <p
          role="alert"
          className="mb-4 rounded bg-[var(--color-destructive)]/10 px-3 py-2 text-sm text-[var(--color-destructive)]"
        >
          {serverError}
        </p>
      )}

      <div className="mb-4">
        <label
          htmlFor="client-name"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Name{' '}
          <span className="text-[var(--color-destructive)]" aria-hidden="true">
            *
          </span>
        </label>
        <Input
          id="client-name"
          type="text"
          autoComplete="organization"
          value={values.name}
          onChange={(e) => handleChange('name', e.target.value)}
          aria-describedby={fieldErrors.name ? 'name-error' : undefined}
          aria-invalid={!!fieldErrors.name}
          data-testid="input-name"
        />
        {fieldErrors.name && (
          <p id="name-error" role="alert" className="mt-1 text-xs text-[var(--color-destructive)]">
            {fieldErrors.name}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="client-email"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Email{' '}
          <span className="text-[var(--color-destructive)]" aria-hidden="true">
            *
          </span>
        </label>
        <Input
          id="client-email"
          type="email"
          autoComplete="email"
          value={values.email}
          onChange={(e) => handleChange('email', e.target.value)}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
          aria-invalid={!!fieldErrors.email}
          data-testid="input-email"
        />
        {fieldErrors.email && (
          <p id="email-error" role="alert" className="mt-1 text-xs text-[var(--color-destructive)]">
            {fieldErrors.email}
          </p>
        )}
      </div>

      <div className="mb-4">
        <label
          htmlFor="client-phone"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Phone
        </label>
        <Input
          id="client-phone"
          type="tel"
          autoComplete="tel"
          value={values.phone ?? ''}
          onChange={(e) => handleChange('phone', e.target.value)}
          aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
          aria-invalid={!!fieldErrors.phone}
          data-testid="input-phone"
        />
        {fieldErrors.phone && (
          <p id="phone-error" role="alert" className="mt-1 text-xs text-[var(--color-destructive)]">
            {fieldErrors.phone}
          </p>
        )}
      </div>

      <div className="mb-6">
        <label
          htmlFor="client-address"
          className="mb-1 block text-sm font-medium text-[var(--color-foreground)]"
        >
          Address
        </label>
        <textarea
          id="client-address"
          rows={3}
          value={values.address ?? ''}
          onChange={(e) => handleChange('address', e.target.value)}
          aria-describedby={fieldErrors.address ? 'address-error' : undefined}
          aria-invalid={!!fieldErrors.address}
          className="block w-full rounded border border-input px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring bg-transparent"
          data-testid="input-address"
        />
        {fieldErrors.address && (
          <p
            id="address-error"
            role="alert"
            className="mt-1 text-xs text-[var(--color-destructive)]"
          >
            {fieldErrors.address}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel} data-testid="btn-cancel">
          Cancel
        </Button>
        <Button type="submit" disabled={submitting} data-testid="btn-submit">
          {submitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
