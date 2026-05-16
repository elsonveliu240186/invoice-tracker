import { useTranslation } from 'react-i18next';
import type { Invoice } from '../model/types';

type Status = Invoice['status'] | 'DELETED';

const STATUS_TOKEN_CLASSES: Record<Status, string> = {
  DRAFT: 'bg-[var(--color-status-draft-bg)] text-[var(--color-status-draft-fg)]',
  SENT: 'bg-[var(--color-status-sent-bg)] text-[var(--color-status-sent-fg)]',
  PAID: 'bg-[var(--color-status-paid-bg)] text-[var(--color-status-paid-fg)]',
  DELETED: 'bg-[var(--color-muted)] text-[var(--color-muted-foreground)]',
};

interface StatusBadgeProps {
  status: Status;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { t } = useTranslation();
  const cls = STATUS_TOKEN_CLASSES[status];
  const label = t(`invoices.status.${status}`, status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
      data-testid="status-badge"
      data-status={status}
    >
      {label}
    </span>
  );
}
