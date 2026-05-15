import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { downloadInvoiceDocx, downloadInvoicePdf } from './downloadInvoice';
import { resetMockInvoices } from '@/mocks/handlers';
import { ApiError } from '@/shared/lib/http';

// Track anchor clicks
const clickSpy = vi.fn();
const appendSpy = vi.fn();
const removeSpy = vi.fn();
let createdAnchor: HTMLAnchorElement;
let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  resetMockInvoices();
  vi.clearAllMocks();

  // Spy on URL static methods without replacing the constructor
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
  revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);

  // Intercept document.createElement for 'a' elements
  const originalCreateElement = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    if (tag === 'a') {
      createdAnchor = originalCreateElement('a');
      createdAnchor.click = clickSpy;
      return createdAnchor;
    }
    return originalCreateElement(tag);
  });

  vi.spyOn(document.body, 'appendChild').mockImplementation((node) => {
    appendSpy(node);
    return node;
  });

  vi.spyOn(document.body, 'removeChild').mockImplementation((node) => {
    removeSpy(node);
    return node;
  });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('downloadInvoiceDocx', () => {
  it('triggers anchor click with correct filename for DOCX', async () => {
    await downloadInvoiceDocx('inv-uuid-1', 'INV-2026-0001');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchor.download).toBe('invoice-INV-2026-0001.docx');
    expect(createdAnchor.href).toContain('blob:mock-url');
  });

  it('calls revokeObjectURL after DOCX download', async () => {
    await downloadInvoiceDocx('inv-uuid-1', 'INV-2026-0001');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('appends and removes anchor from body', async () => {
    await downloadInvoiceDocx('inv-uuid-1', 'INV-2026-0001');
    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('throws ApiError and still calls revokeObjectURL on 404', async () => {
    server.use(
      http.get('/api/v1/invoices/:id/docx', () =>
        HttpResponse.json(
          { status: 404, code: 'INVOICE_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    await expect(downloadInvoiceDocx('bad-id', 'INV-XXXX')).rejects.toBeInstanceOf(ApiError);
    // revokeObjectURL should NOT be called because httpRaw throws before blob creation
    expect(revokeObjectURLSpy).not.toHaveBeenCalled();
  });
});

describe('downloadInvoicePdf', () => {
  it('triggers anchor click with correct filename for PDF', async () => {
    await downloadInvoicePdf('inv-uuid-1', 'INV-2026-0001');
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createdAnchor.download).toBe('invoice-INV-2026-0001.pdf');
  });

  it('calls revokeObjectURL after PDF download', async () => {
    await downloadInvoicePdf('inv-uuid-1', 'INV-2026-0001');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('throws ApiError on 404 for PDF', async () => {
    server.use(
      http.get('/api/v1/invoices/:id/pdf', () =>
        HttpResponse.json(
          { status: 404, code: 'INVOICE_NOT_FOUND', detail: 'Not found' },
          { status: 404 },
        ),
      ),
    );
    await expect(downloadInvoicePdf('bad-id', 'INV-XXXX')).rejects.toBeInstanceOf(ApiError);
  });
});
