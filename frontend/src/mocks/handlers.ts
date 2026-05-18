import { http, HttpResponse } from 'msw';
import type { Client, ClientPage } from '@/features/clients/model/types';
import type { Invoice } from '@/features/invoices/model/types';
import type { TemplateMetadata, UploadTemplateResponse } from '@/features/settings/model/types';
import type {
  Expense,
  ExpensePage,
  ExpenseSummary,
  ExpenseCategory,
} from '@/features/expenses/model/types';

interface CompanyProfile {
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  iban: string;
  swiftBic: string;
  bankName: string;
  updatedAt: string;
}

let _idCounter = 1;

const DEFAULT_COMPANY_FIELDS = {
  companyName: 'Elson Veliu',
  companyAddress: 'Abedin Dino 2, Tirana, Albania',
  companyVatNumber: 'M21813035F',
  companyIban: 'AL6220511162009756CLPRCFEUR0',
  companySwiftBic: 'NCBAALTX',
  companyBankName: 'Banka Kombetare Tregtare',
};

function makeClient(overrides: Partial<Client> = {}): Client {
  const id = String(_idCounter++);
  return {
    id,
    name: `Client ${id}`,
    email: `client${id}@example.com`,
    phone: null,
    address: null,
    ...DEFAULT_COMPANY_FIELDS,
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
        ...DEFAULT_COMPANY_FIELDS,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'uuid-2',
        name: 'Globex',
        email: 'globex@example.com',
        phone: null,
        address: null,
        ...DEFAULT_COMPANY_FIELDS,
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
      ...DEFAULT_COMPANY_FIELDS,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    });
  }
  defaultClients = clients;
  return clients;
}

// ── Invoice mock data ─────────────────────────────────────────────────────────

const BASE_INVOICE: Invoice = {
  id: 'inv-uuid-1',
  number: 'INV-2026-0001',
  clientId: '00000000-0000-0000-0000-000000000003',
  clientEmail: 'client@example.com',
  clientNameSnapshot: 'Acme Corp',
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

// ── Expense mock state ────────────────────────────────────────────────────────

function getCurrentMonthStr(): string {
  const d = new Date();
  return `${String(d.getFullYear())}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const BASE_EXPENSE: Expense = {
  id: 'exp-uuid-1',
  amount: 42.5,
  category: 'FOOD_DRINK',
  description: 'Team lunch',
  expenseDate: `${getCurrentMonthStr()}-10`,
  createdAt: '2026-05-10T12:00:00Z',
  updatedAt: '2026-05-10T12:00:00Z',
};

export let defaultExpenses: Expense[] = [{ ...BASE_EXPENSE }];

export function resetMockExpenses(initial?: Expense[]): void {
  if (initial !== undefined) {
    defaultExpenses = initial;
  } else {
    defaultExpenses = [{ ...BASE_EXPENSE }];
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

// ── Company profile mock state ────────────────────────────────────────────────

const DEFAULT_COMPANY_PROFILE: CompanyProfile = {
  name: '',
  email: '',
  phone: '',
  address: '',
  vatNumber: '',
  iban: '',
  swiftBic: '',
  bankName: '',
  updatedAt: '2026-01-01T00:00:00Z',
};

export let mockCompanyProfile: CompanyProfile = { ...DEFAULT_COMPANY_PROFILE };

export function resetMockCompanyProfile(): void {
  mockCompanyProfile = { ...DEFAULT_COMPANY_PROFILE };
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
      companyName?: string;
      companyAddress?: string;
      companyVatNumber?: string;
      companyIban?: string;
      companySwiftBic?: string;
      companyBankName?: string;
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
      companyName: body.companyName ?? '',
      companyAddress: body.companyAddress ?? '',
      companyVatNumber: body.companyVatNumber ?? '',
      companyIban: body.companyIban ?? '',
      companySwiftBic: body.companySwiftBic ?? '',
      companyBankName: body.companyBankName ?? '',
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
      companyName?: string;
      companyAddress?: string;
      companyVatNumber?: string;
      companyIban?: string;
      companySwiftBic?: string;
      companyBankName?: string;
    };
    const updated: Client = {
      ...defaultClients[idx]!,
      name: body.name,
      email: body.email,
      phone: body.phone ?? null,
      address: body.address ?? null,
      companyName: body.companyName ?? '',
      companyAddress: body.companyAddress ?? '',
      companyVatNumber: body.companyVatNumber ?? '',
      companyIban: body.companyIban ?? '',
      companySwiftBic: body.companySwiftBic ?? '',
      companyBankName: body.companyBankName ?? '',
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

  http.get('/api/v1/dashboard/expense-stats', () =>
    HttpResponse.json({
      from: '2025-12-01',
      to: '2026-05-17',
      grandTotal: '462.50',
      expenseByMonth: [
        { month: '2025-12', total: '0.00' },
        { month: '2026-01', total: '85.00' },
        { month: '2026-02', total: '120.00' },
        { month: '2026-03', total: '95.50' },
        { month: '2026-04', total: '120.00' },
        { month: '2026-05', total: '42.00' },
      ],
      expenseByCategory: [
        { category: 'FOOD_DRINK', total: '162.50', count: 4 },
        { category: 'TRANSPORT', total: '120.00', count: 3 },
        { category: 'HOUSING', total: '95.00', count: 1 },
        { category: 'OTHER', total: '85.00', count: 2 },
      ],
    }),
  ),

  // ── Settings — Company profile endpoints ─────────────────────────────────

  http.get('/api/v1/settings/company', () => {
    return HttpResponse.json(mockCompanyProfile);
  }),

  http.put('/api/v1/settings/company', async ({ request }) => {
    const body = (await request.json()) as Partial<CompanyProfile>;
    mockCompanyProfile = {
      ...mockCompanyProfile,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json(mockCompanyProfile);
  }),

  // ── Invoice CRUD endpoints ────────────────────────────────────────────────

  // POST /api/v1/invoices (create)
  http.post('/api/v1/invoices', async ({ request }) => {
    const body = (await request.json()) as {
      clientId: string;
      number?: string;
      issueDate: string;
      dueDate: string;
      taxRate: number;
      lines: Array<{ description: string; quantity: number; unitPrice: number }>;
    };
    const client = defaultClients.find((c) => c.id === body.clientId);
    if (!client) {
      return HttpResponse.json(
        { status: 404, detail: 'Client not found', code: 'CLIENT_NOT_FOUND' },
        { status: 404 },
      );
    }
    const year = new Date().getFullYear();
    const seq = defaultInvoices.length + 1;
    const number = body.number ?? `INV-${year}-${String(seq).padStart(4, '0')}`;
    const existing = defaultInvoices.find(
      (inv) => inv.number.toLowerCase() === number.toLowerCase(),
    );
    if (existing) {
      return HttpResponse.json(
        { status: 409, detail: 'Invoice number already taken', code: 'INVOICE_NUMBER_TAKEN' },
        { status: 409 },
      );
    }
    const subtotal = body.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const taxAmount = subtotal * body.taxRate;
    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      number,
      clientId: body.clientId,
      clientEmail: client.email,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      taxRate: String(body.taxRate),
      lines: body.lines.map((l, i) => ({
        id: `line-${i}`,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: (l.quantity * l.unitPrice).toFixed(2),
      })),
      subtotal: subtotal.toFixed(2),
      total: (subtotal + taxAmount).toFixed(2),
      status: 'DRAFT',
      lastSentAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    defaultInvoices.push(newInvoice);
    return HttpResponse.json(newInvoice, { status: 201 });
  }),

  // PUT /api/v1/invoices/:id (update)
  http.put('/api/v1/invoices/:id', async ({ params, request }) => {
    const idx = defaultInvoices.findIndex((inv) => inv.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        { status: 404, detail: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
        { status: 404 },
      );
    }
    const invoice = defaultInvoices[idx]!;
    if (invoice.status !== 'DRAFT') {
      return HttpResponse.json(
        { status: 409, detail: 'Invoice is not editable', code: 'INVOICE_NOT_EDITABLE' },
        { status: 409 },
      );
    }
    const body = (await request.json()) as {
      clientId: string;
      number?: string;
      issueDate: string;
      dueDate: string;
      taxRate: number;
      lines: Array<{ description: string; quantity: number; unitPrice: number }>;
    };
    const subtotal = body.lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
    const taxAmount = subtotal * body.taxRate;
    const updated: Invoice = {
      ...invoice,
      clientId: body.clientId,
      number: body.number ?? invoice.number,
      issueDate: body.issueDate,
      dueDate: body.dueDate,
      taxRate: String(body.taxRate),
      lines: body.lines.map((l, i) => ({
        id: `line-upd-${i}`,
        description: l.description,
        quantity: l.quantity,
        unitPrice: l.unitPrice.toFixed(2),
        lineTotal: (l.quantity * l.unitPrice).toFixed(2),
      })),
      subtotal: subtotal.toFixed(2),
      total: (subtotal + taxAmount).toFixed(2),
      updatedAt: new Date().toISOString(),
    };
    defaultInvoices[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/v1/invoices/:id
  http.delete('/api/v1/invoices/:id', ({ params }) => {
    const idx = defaultInvoices.findIndex((inv) => inv.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        { status: 404, detail: 'Invoice not found', code: 'INVOICE_NOT_FOUND' },
        { status: 404 },
      );
    }
    defaultInvoices.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),

  // ── Expense endpoints ─────────────────────────────────────────────────────

  // GET /api/v1/expenses
  http.get('/api/v1/expenses', ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') ?? '0');
    const size = parseInt(url.searchParams.get('size') ?? '20');
    const category = url.searchParams.get('category') as ExpenseCategory | null;
    const dateFrom = url.searchParams.get('dateFrom');
    const dateTo = url.searchParams.get('dateTo');

    let filtered = defaultExpenses;
    if (category) filtered = filtered.filter((e) => e.category === category);
    if (dateFrom) filtered = filtered.filter((e) => e.expenseDate >= dateFrom);
    if (dateTo) filtered = filtered.filter((e) => e.expenseDate <= dateTo);

    const content = filtered.slice(page * size, page * size + size);
    const pageResponse: ExpensePage = {
      content,
      page,
      size,
      totalElements: filtered.length,
      totalPages: Math.ceil(filtered.length / size) || 1,
    };
    return HttpResponse.json(pageResponse);
  }),

  // GET /api/v1/expenses/summary
  http.get('/api/v1/expenses/summary', ({ request }) => {
    const url = new URL(request.url);
    const month = url.searchParams.get('month');
    const targetMonth = month ?? getCurrentMonthStr();

    const inMonth = defaultExpenses.filter((e) => e.expenseDate.startsWith(targetMonth));
    const byCategory: Record<string, { total: number; count: number }> = {};
    for (const e of inMonth) {
      const cat = e.category;
      if (!byCategory[cat]) byCategory[cat] = { total: 0, count: 0 };
      const entry = byCategory[cat];
      if (entry) {
        entry.total += e.amount;
        entry.count += 1;
      }
    }
    const grandTotal = inMonth.reduce((s, e) => s + e.amount, 0);
    const byCategoryArr = Object.entries(byCategory)
      .map(([category, { total, count }]) => ({
        category: category as ExpenseCategory,
        total,
        count,
      }))
      .sort((a, b) => b.total - a.total);

    const summary: ExpenseSummary = {
      month: targetMonth,
      grandTotal,
      totalCount: inMonth.length,
      byCategory: byCategoryArr,
    };
    return HttpResponse.json(summary);
  }),

  // GET /api/v1/expenses/:id
  http.get('/api/v1/expenses/:id', ({ params }) => {
    const expense = defaultExpenses.find((e) => e.id === params['id']);
    if (!expense) {
      return HttpResponse.json(
        { status: 404, code: 'EXPENSE_NOT_FOUND', detail: 'Expense not found' },
        { status: 404 },
      );
    }
    return HttpResponse.json(expense);
  }),

  // POST /api/v1/expenses
  http.post('/api/v1/expenses', async ({ request }) => {
    const body = (await request.json()) as {
      amount: number;
      category: ExpenseCategory;
      expenseDate: string;
      description?: string | null;
    };
    if (!body.amount || body.amount <= 0) {
      return HttpResponse.json(
        { code: 'VALIDATION_ERROR', message: 'amount: must be greater than 0' },
        { status: 400 },
      );
    }
    const newExpense: Expense = {
      id: `exp-${Date.now()}`,
      amount: body.amount,
      category: body.category,
      description: body.description ?? null,
      expenseDate: body.expenseDate,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    defaultExpenses.push(newExpense);
    return HttpResponse.json(newExpense, { status: 201 });
  }),

  // PUT /api/v1/expenses/:id
  http.put('/api/v1/expenses/:id', async ({ params, request }) => {
    const idx = defaultExpenses.findIndex((e) => e.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        { status: 404, code: 'EXPENSE_NOT_FOUND', detail: 'Expense not found' },
        { status: 404 },
      );
    }
    const body = (await request.json()) as {
      amount: number;
      category: ExpenseCategory;
      expenseDate: string;
      description?: string | null;
    };
    const updated: Expense = {
      ...defaultExpenses[idx]!,
      amount: body.amount,
      category: body.category,
      expenseDate: body.expenseDate,
      description: body.description ?? null,
      updatedAt: new Date().toISOString(),
    };
    defaultExpenses[idx] = updated;
    return HttpResponse.json(updated);
  }),

  // DELETE /api/v1/expenses/:id
  http.delete('/api/v1/expenses/:id', ({ params }) => {
    const idx = defaultExpenses.findIndex((e) => e.id === params['id']);
    if (idx === -1) {
      return HttpResponse.json(
        { status: 404, code: 'EXPENSE_NOT_FOUND', detail: 'Expense not found' },
        { status: 404 },
      );
    }
    defaultExpenses.splice(idx, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
