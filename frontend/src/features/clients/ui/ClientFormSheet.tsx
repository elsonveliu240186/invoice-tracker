import { useTranslation } from 'react-i18next';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/ui/sheet';
import { ClientForm } from './ClientForm';
import type { Client } from '../model/types';
import type { CreateClientInput } from '../model/schema';

interface ClientFormSheetProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateClientInput) => Promise<void>;
  editingClient?: Client | null;
}

export function ClientFormSheet({ open, onClose, onSubmit, editingClient }: ClientFormSheetProps) {
  const { t } = useTranslation();

  return (
    <Sheet
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <SheetContent data-testid="client-form-sheet">
        <SheetHeader>
          <SheetTitle>
            {editingClient ? t('clients.form.title.edit') : t('clients.form.title.create')}
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {open && (
            <ClientForm
              initial={editingClient ?? undefined}
              onSubmit={onSubmit}
              onCancel={onClose}
              submitLabel={editingClient ? t('common.update') : t('common.create')}
            />
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
