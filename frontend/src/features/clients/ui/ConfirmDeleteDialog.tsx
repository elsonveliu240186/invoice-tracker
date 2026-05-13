import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';

interface ConfirmDeleteDialogProps {
  open: boolean;
  clientName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDeleteDialog({
  open,
  clientName,
  onConfirm,
  onCancel,
}: ConfirmDeleteDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent data-testid="confirm-delete-dialog">
        <DialogHeader>
          <DialogTitle>{t('clients.delete.title')}</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {t('clients.delete.description', { name: clientName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} data-testid="btn-cancel-delete">
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            data-testid="btn-confirm-delete"
          >
            {t('common.delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
