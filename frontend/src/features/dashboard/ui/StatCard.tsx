const ACCENT_BORDER: Record<string, string> = {
  amber: 'border-l-4 border-l-[var(--color-accent)]',
  green: 'border-l-4 border-l-[var(--color-status-paid-fg)]',
  blue: 'border-l-4 border-l-[var(--color-status-sent-fg)]',
  default: '',
};

interface StatCardProps {
  label: string;
  value: string;
  sub?: string;
  accent?: 'amber' | 'green' | 'blue' | 'default';
}

export function StatCard({ label, value, sub, accent = 'default' }: StatCardProps) {
  const borderClass = ACCENT_BORDER[accent] ?? '';

  return (
    <div
      className={`rounded-lg bg-[var(--color-card)] p-5 shadow-sm ${borderClass}`}
      data-testid="stat-card"
    >
      <p className="text-sm text-[var(--color-muted-foreground)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--color-foreground)]">{value}</p>
      {sub !== undefined && (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{sub}</p>
      )}
    </div>
  );
}
