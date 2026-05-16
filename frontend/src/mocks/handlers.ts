import { http, HttpResponse } from 'msw';
import type { Client, ClientPage } from '@/features/clients/model/types';
import type { Invoice } from '@/features/invoices/model/types';
import type { TemplateMetadata, UploadTemplateResponse } from '@/features/settings/model/types';

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

<<<<<<< HEAD
// ── Invoice mock data ─────────────────────────────────────────────────────────

const BASE_INVOICE: Invoice = {
  id: 'inv-uuid-1',
  number: 'INV-2026-0001',
  clientId: '00000000-0000-0000-0000-000000000003',
  clientEmail: 'client@example.com',
  issueDate: '2026-05-13',
  dueDate: '2026-06-12',
  taxRate: '0.21',
  lines: [
    {
      id: '00000000-0000-0000-0000-000000000001',
      description: 'Consulting services',
      quantity: 2,
      unitPrice: '50.00',
      lineTotal: '100.00',
    },
  ],
  subtotal: '100.00',
  total: '121.00',
  status: 'DRAFT',
  lastSentAt: null,
  createdAt: '2026-05-13T20:00:00Z',
  updatedAt: '2026-05-13T20:00:00Z',
};

export let defaultInvoices: Invoice[] = [{ ...BASE_INVOICE }];

export function resetMockInvoices(initial?: Invoice[]): void {
  if (initial !== undefined) {
    defaultInvoices = initial;
  } else {
    defaultInvoices = [{ ...BASE_INVOICE }];
  }
}

// ── Template mock state ───────────────────────────────────────────────────────

const DEFAULT_TEMPLATE_METADATA: TemplateMetadata = {
  filename: 'invoice-template.docx',
  size: 8192,
  uploadedAt: '2026-01-01T00:00:00Z',
  isDefault: true,
};

export let mockTemplateMetadata: TemplateMetadata = { ...DEFAULT_TEMPLATE_METADATA };

export function resetMockTemplateMetadata(): void {
  mockTemplateMetadata = { ...DEFAULT_TEMPLATE_METADATA };
}

=======
>>>>>>> feat/FEAT-20260512-03-dashboard-core-ui
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

  // ── Invoice endpoints ─────────────────────────────────────────────────────

  // List invoices
  http.get('/api/v1/invoices', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const size = parseInt(url.searchParams.get('size') ?? '20');
    const content = defaultInvoices.slice(page * size, page * size + size);
    return HttpResponse.json({
      content,
      page,
      size,
      totalElements: defaultInvoices.length,
      totalPages: Math.ceil(defaultInvoices.length / size),
    });
  }),

  // Get invoice by id
  http.get('/api/v1/invoices/:id', ({ params }) => {
    const invoice = defaultInvoices.find((inv) => inv.id === params['id']);
    if (!invoice) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND',
        },
        { status: 404 },
      );
    }
    return HttpResponse.json(invoice);
  }),

  // Get invoice DOCX (returns minimal PK\x03\x04 ZIP magic bytes)
  http.get('/api/v1/invoices/:id/docx', ({ params }) => {
    const invoice = defaultInvoices.find((inv) => inv.id === params['id']);
    if (!invoice) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND',
        },
        { status: 404 },
      );
    }
    // Minimal DOCX: PK\x03\x04 ZIP magic + padding to ≥ 5 KB
    const docxMagic = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    const padding = new Uint8Array(5200).fill(0x00);
    const body = new Uint8Array(docxMagic.length + padding.length);
    body.set(docxMagic);
    body.set(padding, docxMagic.length);
    return new HttpResponse(body.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="invoice-${invoice.number}.docx"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }),

  // Get invoice PDF (returns a minimal valid PDF byte string)
  http.get('/api/v1/invoices/:id/pdf', ({ params }) => {
    const invoice = defaultInvoices.find((inv) => inv.id === params['id']);
    if (!invoice) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND',
        },
        { status: 404 },
      );
    }
    // Minimal %PDF- content to satisfy ≥ 1 KB check in tests
    const pdfContent = '%PDF-1.4\n' + '0'.repeat(1100);
    return new HttpResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="invoice-${invoice.number}.pdf"`,
        'Cache-Control': 'private, no-store',
      },
    });
  }),

  // Send invoice email
  http.post('/api/v1/invoices/:id/send-email', ({ params }) => {
    const idx = defaultInvoices.findIndex((inv) => inv.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND',
        },
        { status: 404 },
      );
    }
    const lastSentAt = new Date().toISOString();
    defaultInvoices[idx] = { ...defaultInvoices[idx]!, lastSentAt };
    return HttpResponse.json({ lastSentAt });
  }),

  // Mark invoice as paid
  http.patch('/api/v1/invoices/:id/mark-paid', ({ params }) => {
    const idx = defaultInvoices.findIndex((inv) => inv.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        {
          type: 'about:blank',
          title: 'Not Found',
          status: 404,
          detail: 'Invoice not found',
          code: 'INVOICE_NOT_FOUND',
        },
        { status: 404 },
      );
    }
    defaultInvoices[idx] = { ...defaultInvoices[idx]!, status: 'PAID' };
    return HttpResponse.json(defaultInvoices[idx]);
  }),

  // ── Settings — Invoice Template endpoints ─────────────────────────────────

  // GET /api/v1/settings/invoice-template/preview
  http.get('/api/v1/settings/invoice-template/preview', () => {
    return HttpResponse.json(mockTemplateMetadata);
  }),

  // GET /api/v1/settings/invoice-template/download
  http.get('/api/v1/settings/invoice-template/download', () => {
    const docxMagic = new Uint8Array([0x50, 0x4b, 0x03, 0x04]);
    return new HttpResponse(docxMagic.buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': 'attachment; filename="invoice-template.docx"',
      },
    });
  }),

  // POST /api/v1/settings/invoice-template
  // NOTE: request.formData() with File entries hangs in the jsdom/Node test environment
  // (MSW v2 + jsdom cannot reliably stream multipart bodies containing File objects).
  // The success case is handled here without parsing the body; error cases (415, 413)
  // are exercised via per-test server.use() overrides in templateApi.test.ts.
  http.post('/api/v1/settings/invoice-template', () => {
    const uploadedAt = new Date().toISOString();
    const response: UploadTemplateResponse = {
      filename: 'invoice-template.docx',
      size: 1024,
      uploadedAt,
    };
    mockTemplateMetadata = {
      filename: 'invoice-template.docx',
      size: 1024,
      uploadedAt,
      isDefault: false,
    };
    return HttpResponse.json(response);
  }),

  // ── Dashboard endpoints ───────────────────────────────────────────────────

  http.get('/api/v1/dashboard/stats', () =>
    HttpResponse.json({
      totalInvoices: 12,
      draftCount: 4,
      sentCount: 5,
      paidCount: 3,
      totalRevenue: 24500,
      paidRevenue: 8200,
      pendingRevenue: 16300,
      revenueByMonth: [
        { month: '2026-01', revenue: 3200 },
        { month: '2026-02', revenue: 4100 },
        { month: '2026-03', revenue: 5800 },
        { month: '2026-04', revenue: 4400 },
        { month: '2026-05', revenue: 7000 },
      ],
    }),
  ),
];
