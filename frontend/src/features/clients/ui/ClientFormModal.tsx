import type { ReactNode } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/ui/dialog';

interface ClientFormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ClientFormModal({ title, open, onClose, children }: ClientFormModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent data-testid="client-modal" closeButtonTestId="modal-close">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
