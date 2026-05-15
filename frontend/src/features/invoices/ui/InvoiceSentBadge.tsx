import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';

interface InvoiceSentBadgeProps {
  lastSentAt: string | null;
}

function formatSentDate(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function InvoiceSentBadge({ lastSentAt }: InvoiceSentBadgeProps) {
  const { t } = useTranslation();

  if (!lastSentAt) {
    return null;
  }

  return (
    <Badge variant="secondary" data-testid="invoice-sent-badge">
      {t('invoices.status.sentOn', { date: formatSentDate(lastSentAt) })}
    </Badge>
  );
}
