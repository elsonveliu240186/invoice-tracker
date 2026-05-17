import { useTranslation } from 'react-i18next';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';

interface PlaceholderGroup {
  groupKey: string;
  placeholders: string[];
}

const PLACEHOLDER_GROUPS: PlaceholderGroup[] = [
  {
    groupKey: 'invoices.template.placeholders.company',
    placeholders: [
      '{{company.name}}',
      '{{company.email}}',
      '{{company.phone}}',
      '{{company.address}}',
    ],
  },
  {
    groupKey: 'invoices.template.placeholders.client',
    placeholders: ['{{client.name}}', '{{client.email}}', '{{client.phone}}', '{{client.address}}'],
  },
  {
    groupKey: 'invoices.template.placeholders.invoice',
    placeholders: [
      '{{invoice.number}}',
      '{{invoice.issueDate}}',
      '{{invoice.dueDate}}',
      '{{invoice.subtotal}}',
      '{{invoice.tax}}',
      '{{invoice.total}}',
    ],
  },
  {
    groupKey: 'invoices.template.placeholders.lines',
    placeholders: [
      '{{#lines}}',
      '{{description}}',
      '{{quantity}}',
      '{{unitPrice}}',
      '{{lineTotal}}',
      '{{/lines}}',
    ],
  },
];

export function PlaceholderReferenceCard() {
  const { t } = useTranslation();

  async function handleCopy(placeholder: string) {
    try {
      await navigator.clipboard.writeText(placeholder);
      toast.success(t('invoices.template.copyPlaceholder'));
    } catch {
      // clipboard not available in test env — silently ignore
    }
  }

  return (
    <Card data-testid="placeholder-reference-card">
      <CardHeader>
        <CardTitle>{t('invoices.template.placeholders.title')}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {PLACEHOLDER_GROUPS.map((group) => (
          <div key={group.groupKey} data-testid={`placeholder-group-${group.groupKey}`}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
              {t(group.groupKey)}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.placeholders.map((ph) => (
                <button
                  key={ph}
                  type="button"
                  onClick={() => void handleCopy(ph)}
                  className="inline-flex items-center gap-1 rounded bg-[var(--color-accent)] px-2 py-0.5 font-mono text-xs hover:bg-[var(--color-accent)]/80"
                  data-testid={`placeholder-copy-btn`}
                  aria-label={`${t('invoices.template.copyPlaceholder')}: ${ph}`}
                >
                  <Copy className="h-2.5 w-2.5" aria-hidden="true" />
                  {ph}
                </button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
