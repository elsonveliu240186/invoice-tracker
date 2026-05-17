import type { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Skeleton } from '@/shared/ui/skeleton';

interface KpiCardProps {
  title: string;
  value?: number | null;
  icon?: ReactNode;
  loading?: boolean;
}

export function KpiCard({ title, value, icon, loading = false }: KpiCardProps) {
  return (
    <Card data-testid="kpi-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-[var(--color-muted-foreground)]">
          {title}
        </CardTitle>
        {icon && (
          <span className="text-[var(--color-muted-foreground)]" aria-hidden="true">
            {icon}
          </span>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-8 w-20" data-testid="kpi-skeleton" />
        ) : (
          <p className="text-2xl font-bold" data-testid="kpi-value">
            {value?.toLocaleString() ?? '—'}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
