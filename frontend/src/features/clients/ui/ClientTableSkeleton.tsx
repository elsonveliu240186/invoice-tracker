import { Skeleton } from '@/shared/ui/skeleton';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/shared/ui/table';

const SKELETON_ROWS = 5;
const SKELETON_COLS = 6;

export function ClientTableSkeleton() {
  return (
    <div data-testid="clients-table-skeleton">
      <Table>
        <TableHeader>
          <TableRow>
            {Array.from({ length: SKELETON_COLS }).map((_, i) => (
              <TableHead key={i}>
                <Skeleton className="h-4 w-20" />
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: SKELETON_ROWS }).map((_, rowIdx) => (
            <TableRow key={rowIdx} role="presentation" data-testid="skeleton-row">
              {Array.from({ length: SKELETON_COLS }).map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
