import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/cn';
import { FormLabel } from './FormLabel';

export interface FormFieldProps {
  /** `id` of the control — wired to label `htmlFor` and error `aria-describedby`. */
  id: string;
  /** Label text. */
  label: string;
  /** Whether the field is required (shows asterisk on label). */
  required?: boolean;
  /** The form control (Input, PasswordField, textarea, etc.). */
  children: ReactNode;
  /** Validation / server error message. When set, renders an alert paragraph. */
  error?: string;
  className?: string;
}

/**
 * Vertical wrapper: label → control → error message.
 *
 * - Enforces consistent `space-y-1.5` spacing across all form fields.
 * - Wires `aria-describedby` on the error paragraph so screen readers
 *   associate the message with the control.
 * - The control slot is rendered as-is; callers are responsible for
 *   passing `id`, `aria-invalid`, and `aria-describedby` to the control.
 */
export function FormField({ id, label, required, children, error, className }: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div data-testid="form-field" className={cn('flex flex-col space-y-1.5', className)}>
      <FormLabel htmlFor={id} required={required}>
        {label}
      </FormLabel>

      {children}

      {error && (
        <p id={errorId} role="alert" className="text-xs text-[var(--color-destructive)]">
          {error}
        </p>
      )}
    </div>
  );
}
