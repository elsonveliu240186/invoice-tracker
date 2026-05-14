import { useTranslation } from 'react-i18next';
import { AlertTriangle, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';
import { useTemplateMetadata } from '../api/useTemplateMetadata';
import { TemplateUploadForm } from './TemplateUploadForm';
import { downloadTemplate } from '../api/templateApi';

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(isoString));
}

export function InvoiceTemplateSettingsPage() {
  const { t } = useTranslation();
  const { data: metadata, loading, refetch } = useTemplateMetadata();

  return (
    <div data-testid="invoice-template-settings-page">
      <h1 className="mb-6 text-2xl font-bold text-[var(--color-foreground)]">
        {t('settings.invoiceTemplate.title')}
      </h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('settings.invoiceTemplate.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current template metadata */}
          {loading && (
            <div data-testid="template-metadata-loading" className="space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          )}

          {!loading && metadata && (
            <div data-testid="template-metadata" className="space-y-2 text-sm">
              {metadata.isDefault && (
                <div
                  data-testid="default-template-warning"
                  className="flex items-center gap-2 rounded-md bg-yellow-50 px-3 py-2 text-yellow-800 border border-yellow-200"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t('settings.invoiceTemplate.isDefaultWarning')}</span>
                </div>
              )}
              <div className="flex gap-6 flex-wrap">
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {t('settings.invoiceTemplate.currentFilename')}
                  </p>
                  <p data-testid="template-filename" className="font-medium">
                    {metadata.filename}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {t('settings.invoiceTemplate.uploadedAt')}
                  </p>
                  <p data-testid="template-uploaded-at">{formatDate(metadata.uploadedAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">Size</p>
                  <p data-testid="template-size">{formatBytes(metadata.size)}</p>
                </div>
              </div>

              {/* Download current template — uses authenticated fetch to avoid 401 */}
              <button
                type="button"
                onClick={() => void downloadTemplate()}
                className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                data-testid="link-download-current"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                {t('settings.invoiceTemplate.downloadCurrent')}
              </button>
            </div>
          )}

          {/* Upload form */}
          <div className="pt-4 border-t border-[var(--color-border)]">
            <TemplateUploadForm onUploadSuccess={refetch} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
