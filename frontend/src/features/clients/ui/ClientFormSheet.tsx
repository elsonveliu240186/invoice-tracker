import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ClientForm } from './ClientForm';
import type { Client } from '../model/types';
import type { CreateClientInput } from '../model/schema';

interface ClientFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  editingClient: Client | null;
}

export function ClientFormSheet({ open, onClose, onSubmit, editingClient }: ClientFormSheetProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const title = editingClient ? t('clients.form.title.edit') : t('clients.newClient');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
        data-testid="sheet-backdrop"
      />
      {/* Sheet panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sheet-title"
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-[var(--color-background)] shadow-xl"
        data-testid="client-form-sheet"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 id="sheet-title" className="text-lg font-semibold text-[var(--color-foreground)]">
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
          <ClientForm
            initial={editingClient ?? undefined}
            onSubmit={onSubmit}
            onCancel={onClose}
            submitLabel={editingClient ? t('common.update') : t('common.create')}
          />
        </div>
      </div>
    </>
  );
}
