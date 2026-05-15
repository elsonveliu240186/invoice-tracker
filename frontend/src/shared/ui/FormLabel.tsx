import type { LabelHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface FormLabelProps extends Omit<LabelHTMLAttributes<HTMLLabelElement>, 'required'> {
  /** Renders a red asterisk after the label text. */
  required?: boolean | undefined;
}

/**
 * Accessible form label using the foreground design token.
 * Renders `<label>` with consistent text styling across light and dark modes.
 */
export function FormLabel({ children, required, className, ...props }: FormLabelProps) {
  return (
    <label
      className={cn('text-sm font-medium text-[var(--color-foreground)]', className)}
      {...props}
    >
      {children}
      {required && (
        <span className="ml-0.5 text-[var(--color-destructive)]" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}
