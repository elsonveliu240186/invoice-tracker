import type { Client } from '../model/types';

interface ClientTableProps {
  clients: Client[];
  onEdit: (client: Client) => void;
  onDelete: (client: Client) => void;
}

export function ClientTable({ clients, onEdit, onDelete }: ClientTableProps) {
  if (clients.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground" data-testid="empty-state">
        No clients found.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="min-w-full text-sm" data-testid="clients-table">
        <thead className="bg-muted">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Phone</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Address</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {clients.map((client) => (
            <tr key={client.id} data-testid="client-row">
              <td className="px-4 py-3 font-medium">{client.name}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.phone ?? '—'}</td>
              <td className="px-4 py-3 text-muted-foreground">{client.address ?? '—'}</td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={() => onEdit(client)}
                  className="mr-2 rounded px-3 py-1 text-xs text-primary hover:bg-accent"
                  data-testid="btn-edit"
                  aria-label={`Edit ${client.name}`}
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(client)}
                  className="rounded px-3 py-1 text-xs text-red-600 hover:bg-red-50"
                  data-testid="btn-delete"
                  aria-label={`Delete ${client.name}`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
