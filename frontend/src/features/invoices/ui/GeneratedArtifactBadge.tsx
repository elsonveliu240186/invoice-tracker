import { useTranslation } from 'react-i18next';
import { Badge } from '@/shared/ui/badge';
import type { InvoiceArtifactsMetadata } from '../model/artifact';

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(isoString));
}

interface GeneratedArtifactBadgeProps {
  metadata: InvoiceArtifactsMetadata | null;
}

export function GeneratedArtifactBadge({ metadata }: GeneratedArtifactBadgeProps) {
  const { t } = useTranslation();

  if (!metadata || (!metadata.pdf && !metadata.docx)) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap" data-testid="generated-artifact-badge">
      {metadata.pdf && (
        <Badge variant="secondary" data-testid="badge-generated-pdf">
          {t('invoices.badge.generatedPdf')} · {formatDate(metadata.pdf.generatedAt)}
        </Badge>
      )}
      {metadata.docx && (
        <Badge variant="secondary" data-testid="badge-generated-docx">
          {t('invoices.badge.generatedDocx')} · {formatDate(metadata.docx.generatedAt)}
        </Badge>
      )}
    </div>
  );
}
