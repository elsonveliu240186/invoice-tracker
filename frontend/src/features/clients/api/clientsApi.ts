import { http } from '@/shared/lib/http';
import type { Client, ClientPage, ClientQuery, CreateClient, UpdateClient } from '../model/types';

const BASE = '/api/v1/clients';

export async function listClients(query: ClientQuery = {}): Promise<ClientPage> {
  const params = new URLSearchParams();
  if (query.query) params.set('query', query.query);
  if (query.page !== undefined) params.set('page', String(query.page));
  if (query.size !== undefined) params.set('size', String(query.size));
  params.set('sort', query.sort ?? 'name,asc');

  const qs = params.toString();
  return http<ClientPage>(`${BASE}${qs ? `?${qs}` : ''}`);
}

export async function getClient(id: string): Promise<Client> {
  return http<Client>(`${BASE}/${id}`);
}

export async function createClient(data: CreateClient): Promise<Client> {
  return http<Client>(BASE, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateClient(id: string, data: UpdateClient): Promise<Client> {
  return http<Client>(`${BASE}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteClient(id: string): Promise<void> {
  return http<void>(`${BASE}/${id}`, { method: 'DELETE' });
}
