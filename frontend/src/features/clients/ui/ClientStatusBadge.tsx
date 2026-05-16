import { Badge } from '@/shared/ui/badge';
import type { ClientStatus } from '../model/derive';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  if (status === 'ACTIVE') {
    return (
      <Badge
<<<<<<< HEAD
        variant="secondary"
        className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        data-testid="status-badge-active"
=======
        variant="default"
        data-variant="success"
        data-testid="status-badge"
        className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
      >
        Active
      </Badge>
    );
  }
<<<<<<< HEAD
  return (
    <Badge variant="outline" data-testid="status-badge-inactive">
=======

  return (
    <Badge
      variant="secondary"
      data-variant="muted"
      data-testid="status-badge"
      className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
    >
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
      Inactive
    </Badge>
  );
}
