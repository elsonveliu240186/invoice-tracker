import { useTranslation } from 'react-i18next';

const PLACEHOLDER_ITEMS = [
  { id: '1', text: 'Invoice #001 sent to Acme Corp' },
  { id: '2', text: 'New client Globex added' },
  { id: '3', text: 'Payment received from Initech' },
];

export function RecentActivity() {
  const { t } = useTranslation();

  return (
    <section aria-label={t('dashboard.activity.title')} data-testid="recent-activity">
      <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
        {t('dashboard.activity.title')}
      </h2>
      <ul className="space-y-3" data-testid="activity-list">
        {PLACEHOLDER_ITEMS.map((item) => (
          <li
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]"
            data-testid="activity-item"
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-primary)]"
              aria-hidden="true"
            />
            {item.text}
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-[var(--color-muted-foreground)]">
        {t('dashboard.activity.empty')}
      </p>
    </section>
  );
}
