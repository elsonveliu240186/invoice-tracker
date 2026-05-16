import { useTranslation } from 'react-i18next';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { ClientStatusBadge } from './ClientStatusBadge';
import { deriveStatus, formatDate } from '../model/derive';
import type { Client } from '../model/types';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  const { t } = useTranslation();

  if (clients.length === 0) {
    return (
<<<<<<< HEAD
      <p
        className="py-8 text-center text-[var(--color-muted-foreground)]"
        data-testid="empty-state"
      >
=======
      <p className="py-8 text-center text-muted-foreground" data-testid="empty-state">
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
        {t('clients.empty.title')}
      </p>
    );
  }

  return (
<<<<<<< HEAD
    <div className="overflow-x-auto rounded border border-border" data-testid="clients-table">
=======
    <div className="rounded border border-border" data-testid="clients-table">
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t('clients.column.name')}</TableHead>
            <TableHead>{t('clients.column.email')}</TableHead>
            <TableHead>{t('clients.column.phone')}</TableHead>
            <TableHead>{t('clients.column.status')}</TableHead>
            <TableHead>{t('clients.column.updated')}</TableHead>
            <TableHead className="text-right">{t('clients.column.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => (
            <TableRow key={client.id} data-testid="client-row">
              <TableCell className="font-medium">{client.name}</TableCell>
<<<<<<< HEAD
              <TableCell className="text-[var(--color-muted-foreground)]">{client.email}</TableCell>
              <TableCell className="text-[var(--color-muted-foreground)]">
                {client.phone ?? '—'}
              </TableCell>
              <TableCell>
                <ClientStatusBadge status={deriveStatus(client)} />
              </TableCell>
              <TableCell className="text-[var(--color-muted-foreground)]">
=======
              <TableCell className="text-muted-foreground">{client.email}</TableCell>
              <TableCell className="text-muted-foreground">{client.phone ?? '—'}</TableCell>
              <TableCell>
                <ClientStatusBadge status={deriveStatus(client)} />
              </TableCell>
              <TableCell className="text-muted-foreground">
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
                {formatDate(client.updatedAt)}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEdit(client)}
                  data-testid="btn-edit"
                  aria-label={`${t('clients.action.edit')} ${client.name}`}
                  className="mr-1"
                >
                  {t('clients.action.edit')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(client)}
                  data-testid="btn-delete"
                  aria-label={`${t('clients.action.delete')} ${client.name}`}
<<<<<<< HEAD
                  className="text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10"
=======
                  className="text-red-600 hover:bg-red-50 hover:text-red-600"
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
                >
                  {t('clients.action.delete')}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
