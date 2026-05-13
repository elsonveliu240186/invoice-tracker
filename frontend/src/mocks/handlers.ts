import { http, HttpResponse } from 'msw';
import type { Client, ClientPage } from '@/features/clients/model/types';

let _idCounter = 1;

function makeClient(overrides: Partial<Client> = {}): Client {
  const id = String(_idCounter++);
  return {
    id,
    name: `Client ${id}`,
    email: `client${id}@example.com`,
    phone: null,
    address: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export let defaultClients: Client[] = [
  makeClient({ id: 'uuid-1', name: 'Acme Corp', email: 'acme@example.com' }),
  makeClient({ id: 'uuid-2', name: 'Globex', email: 'globex@example.com' }),
];

/**
 * Resets the mock clients array to a deterministic initial state.
 * Call this in beforeEach to keep tests isolated.
 */
export function resetMockClients(initial?: Client[]): void {
  _idCounter = 100;
  if (initial !== undefined) {
    defaultClients = initial;
  } else {
    defaultClients = [
      {
        id: 'uuid-1',
        name: 'Acme Corp',
        email: 'acme@example.com',
        phone: null,
        address: null,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'uuid-2',
        name: 'Globex',
        email: 'globex@example.com',
        phone: null,
        address: null,
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ];
  }
}

/**
 * Seeds n clients for pagination and other tests requiring larger datasets.
 */
export function seedMany(n: number): Client[] {
  _idCounter = 200;
  const clients: Client[] = [];
  for (let i = 0; i < n; i++) {
    clients.push({
      id: `seed-${i}`,
      name: `Seed Client ${i}`,
      email: `seed${i}@example.com`,
      phone: null,
      address: null,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
  }
  defaultClients = clients;
  return clients;
}

export const handlers = [
  // ── Auth endpoints ────────────────────────────────────────────────────────

  http.post('/api/v1/auth/login', async ({ request }) => {
    const body = (await request.json()) as { email?: string; password?: string };
    if (!body.email || !body.password) {
      return HttpResponse.json({ status: 400, detail: 'Missing fields' }, { status: 400 });
    }
    return HttpResponse.json({ email: body.email, displayName: 'Test User' });
  }),

  http.post('/api/v1/auth/register', async ({ request }) => {
    const body = (await request.json()) as {
      displayName?: string;
      email?: string;
      password?: string;
    };
    if (!body.email || !body.password || !body.displayName) {
      return HttpResponse.json({ status: 400, detail: 'Missing fields' }, { status: 400 });
    }
    return HttpResponse.json({ email: body.email, displayName: body.displayName }, { status: 201 });
  }),

  http.post('/api/v1/auth/forgot-password', () => {
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Client endpoints ──────────────────────────────────────────────────────

  // List clients
  http.get('/api/v1/clients', ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get('query') ?? '';
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const size = parseInt(url.searchParams.get('size') ?? '20');

    const filtered = query
      ? defaultClients.filter(
          (c) =>
            c.name.toLowerCase().includes(query.toLowerCase()) ||
            c.email.toLowerCase().includes(query.toLowerCase()),
        )
      : defaultClients;

    const content = filtered.slice(page * size, page * size + size);
    const pageResponse: ClientPage = {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    };

    return HttpResponse.json(pageResponse);
  }),

  // Get client by id
  http.get('/api/v1/clients/:id', ({ params }) => {
    const client = defaultClients.find((c) => c.id === params['id']);
    if (!client) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Client not found',
          code: 'CLIENT_NOT_FOUND',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(client);
  }),

  // Create client
  http.post('/api/v1/clients', async ({ request }) => {
    const body = (await request.json()) as {
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    const existing = defaultClients.find((c) => c.email.toLowerCase() === body.email.toLowerCase());
    if (existing) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Conflict',
          status: 409,
          detail: 'A client with this email already exists.',
          code: 'CLIENT_EMAIL_TAKEN',
        },
        { status: 409 },
      );
    }
    const newClient = makeClient({
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      address: body.address ?? null,
    });
    defaultClients.push(newClient);
    return HttpResponse.json(newClient, { status: 201 });
  }),

  // Update client
  http.put('/api/v1/clients/:id', async ({ params, request }) => {
    const idx = defaultClients.findIndex((c) => c.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        { status: 404, code: 'CLIENT_NOT_FOUND', detail: 'Client not found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      name: string;
      email: string;
      phone?: string;
      address?: string;
    };
    const updated: Client = {
      ...defaultClients[idx]!,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      address: body.address ?? null,
      updatedAt: new Date().toISOString(),
    };
    defaultClients[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // Delete client
  http.delete('/api/v1/clients/:id', ({ params }) => {
    const idx = defaultClients.findIndex((c) => c.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        { status: 404, code: 'CLIENT_NOT_FOUND', detail: 'Client not found' },
        { status: 404 },
      );
    }
    defaultClients.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
