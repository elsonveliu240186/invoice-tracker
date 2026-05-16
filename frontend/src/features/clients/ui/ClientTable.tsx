import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/shared/ui/table';
import { Button } from '@/shared/ui/button';
import { ClientStatusBadge } from './ClientStatusBadge';
import { deriveStatus, formatDate } from '../model/derive';
import type { Client } from '../model/types';

interface ClientTableProps {
  clients: Client[];
  onView: (client: Client) => void;
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({ clients, onView, onEdit, onDelete }: ClientTableProps) {
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
            <TableHead className="w-28" />
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
<<<<<<< HEAD
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
=======
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onView(client)}
                    data-testid="btn-view"
                    aria-label={`${t('clients.action.view')} ${client.name}`}
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(client)}
                    data-testid="btn-edit"
                    aria-label={`${t('clients.action.edit')} ${client.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(client)}
                    data-testid="btn-delete"
                    aria-label={`${t('clients.action.delete')} ${client.name}`}
                  >
                    <Trash2
                      className="h-4 w-4 text-[var(--color-destructive)]"
                      aria-hidden="true"
                    />
                  </Button>
                </div>
>>>>>>> feat/FEAT-20260516-01-expense-tracking
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
