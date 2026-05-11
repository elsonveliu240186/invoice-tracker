import { useEffect, type ReactNode } from 'react';

interface ClientFormModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}

export function ClientFormModal({ title, open, onClose, children }: ClientFormModalProps) {
  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="client-modal"
      className="fixed inset-0 z-40 flex items-center justify-center"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
        data-testid="modal-backdrop"
      />
      {/* Panel */}
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold">
            {title}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close dialog"
            className="text-slate-400 hover:text-slate-600"
            data-testid="modal-close"
          >
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
