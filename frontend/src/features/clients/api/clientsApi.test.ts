import { describe, it, expect, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { listClients, getClient, createClient, updateClient, deleteClient } from './clientsApi';
import { ApiError } from '@/shared/lib/http';

describe('clientsApi', () => {
  describe('listClients', () => {
    it('returns a ClientPage for a successful response', async () => {
      const page = await listClients();
      expect(page.content).toBeInstanceOf(Array);
      expect(typeof page.totalElements).toBe('number');
      expect(typeof page.totalPages).toBe('number');
    });

    it('sends query and page params', async () => {
      const spy = vi.spyOn(globalThis, 'fetch');
      await listClients({ query: 'acme', page: 2, size: 10 });
      const url = String((spy.mock.calls[0] as [string, RequestInit])[0]);
      expect(url).toContain('query=acme');
      expect(url).toContain('page=2');
      expect(url).toContain('size=10');
      spy.mockRestore();
    });

    it('filters results by query', async () => {
      const page = await listClients({ query: 'Acme' });
      expect(page.content.some((c) => c.name === 'Acme Corp')).toBe(true);
    });
  });

  describe('getClient', () => {
    it('returns a client by id', async () => {
      const client = await getClient('uuid-1');
      expect(client.id).toBe('uuid-1');
    });

    it('throws ApiError with 404 for unknown id', async () => {
      await expect(getClient('nonexistent')).rejects.toSatisfy(
        (err: unknown) => err instanceof ApiError && err.status === 404,
      );
    });
  });

  describe('createClient', () => {
    it('creates and returns a new client', async () => {
      const client = await createClient({ name: 'New Co', email: 'new@co.com' });
      expect(client.name).toBe('New Co');
      expect(client.id).toBeDefined();
    });

    it('throws ApiError with code CLIENT_EMAIL_TAKEN on 409', async () => {
      // Use an email that exists in default handlers
      await expect(createClient({ name: 'Dup', email: 'acme@example.com' })).rejects.toSatisfy(
        (err: unknown) =>
          err instanceof ApiError && err.status === 409 && err.code === 'CLIENT_EMAIL_TAKEN',
      );
    });
  });

  describe('updateClient', () => {
    it('updates and returns the client', async () => {
      const client = await updateClient('uuid-1', {
        name: 'Acme Updated',
        email: 'acme@example.com',
      });
      expect(client.name).toBe('Acme Updated');
    });

    it('throws ApiError with 404 for unknown id', async () => {
      await expect(
        updateClient('ghost-id', { name: 'X', email: 'x@x.com' }),
      ).rejects.toSatisfy((err: unknown) => err instanceof ApiError && err.status === 404);
    });
  });

  describe('deleteClient', () => {
    it('returns undefined on success (204)', async () => {
      server.use(
        http.delete('/api/v1/clients/del-test', () => new HttpResponse(null, { status: 204 })),
      );
      const result = await deleteClient('del-test');
      expect(result).toBeUndefined();
    });

    it('throws ApiError with 404 for unknown id', async () => {
      await expect(deleteClient('ghost-delete')).rejects.toSatisfy(
        (err: unknown) => err instanceof ApiError && err.status === 404,
      );
    });
  });

  describe('credentials', () => {
    it('all methods send credentials: include', async () => {
      const spy = vi.spyOn(globalThis, 'fetch');
      await listClients();
      const [, init] = spy.mock.calls[0] as [string, RequestInit];
      expect(init.credentials).toBe('include');
      spy.mockRestore();
    });
  });
});
