import { Badge } from '@/shared/ui/badge';
import type { ClientStatus } from '../model/derive';

interface ClientStatusBadgeProps {
  status: ClientStatus;
}

export function ClientStatusBadge({ status }: ClientStatusBadgeProps) {
  if (status === 'ACTIVE') {
    return (
      <Badge
        variant="default"
        data-variant="success"
        data-testid="status-badge"
        className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100"
      >
        Active
      </Badge>
    );
  }

  return (
    <Badge
      variant="secondary"
      data-variant="muted"
      data-testid="status-badge"
      className="bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
    >
      Inactive
    </Badge>
  );
}
