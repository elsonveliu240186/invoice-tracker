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
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onCancel();
      }}
    >
      <DialogContent data-testid="confirm-delete-dialog">
        <DialogHeader>
          <DialogTitle>Delete client</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to delete <strong>{clientName}</strong>? This action cannot be
            undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onCancel} data-testid="btn-cancel-delete">
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={onConfirm}
            data-testid="btn-confirm-delete"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
