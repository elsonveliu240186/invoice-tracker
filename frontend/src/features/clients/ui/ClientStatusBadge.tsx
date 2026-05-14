import { Badge } from '@/shared/ui/badge';
import type { ClientStatus } from '../model/derive';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  if (status === 'ACTIVE') {
    return (
      <Badge
        variant="secondary"
        className="bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800"
        data-testid="status-badge-active"
      >
        Active
      </Badge>
    );
  }
  return (
    <Badge variant="outline" data-testid="status-badge-inactive">
      Inactive
    </Badge>
  );
}
