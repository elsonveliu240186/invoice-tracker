import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { InvoiceForm } from './InvoiceForm';
import type { Invoice } from '../model/types';
import type { InvoiceFormValues } from '../model/schema';

interface InvoiceFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: InvoiceFormValues) => Promise<void>;
  editingInvoice: Invoice | null;
  nextNumber?: string | undefined;
}

export function InvoiceFormSheet({
  open,
  onClose,
  onSubmit,
  editingInvoice,
  nextNumber,
}: InvoiceFormSheetProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const title = editingInvoice ? t('invoices.form.title.edit') : t('invoices.form.title.create');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
        data-testid="sheet-backdrop"
      />
      {/* Centered dialog panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="invoice-sheet-title"
        className="fixed left-1/2 top-1/2 z-50 flex max-h-[90vh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col rounded-lg bg-[var(--color-background)] shadow-xl"
        data-testid="invoice-form-sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2
            id="invoice-sheet-title"
            className="text-lg font-semibold text-[var(--color-foreground)]"
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="rounded-sm p-1 opacity-70 transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
            data-testid="sheet-close"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">{t('common.close')}</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <InvoiceForm
            initial={editingInvoice ?? undefined}
            nextNumber={nextNumber}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitLabel={editingInvoice ? t('common.update') : t('common.create')}
          />
        </div>
      </div>
    </>
  );
}
