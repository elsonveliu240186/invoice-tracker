import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';
import { useSendInvoice } from './useSendInvoice';
import { resetMockInvoices } from '@/mocks/handlers';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

beforeEach(() => {
  resetMockInvoices();
  vi.clearAllMocks();
});

describe('useSendInvoice', () => {
  it('starts with loading=false', () => {
    const { result } = renderHook(() => useSendInvoice());
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toBeNull();
  });

  it('transitions to loading during mutation and resolves on success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSendInvoice(onSuccess));

    let promise: Promise<unknown>;
    act(() => {
      promise = result.current.mutate('inv-uuid-1');
    });

    expect(result.current.loading).toBe(true);

    await act(async () => {
      await promise;
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.data?.lastSentAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(result.current.error).toBeNull();
  });

  it('fires success toast on happy path', async () => {
    const { toast } = await import('sonner');
    const { result } = renderHook(() => useSendInvoice());

    await act(async () => {
      await result.current.mutate('inv-uuid-1');
    });

    // i18n resolves to the English text; hook tests run without a React provider
    // so we assert the spy was called with a non-empty string
    expect(toast.success).toHaveBeenCalledWith(expect.any(String));
  });

  it('calls onSuccess callback on success', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSendInvoice(onSuccess));

    await act(async () => {
      await result.current.mutate('inv-uuid-1');
    });

    expect(onSuccess).toHaveBeenCalledOnce();
  });

  it('fires error toast on 502 EMAIL_DELIVERY_FAILED and sets error state', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Bad Gateway',
            status: 502,
            detail: 'SMTP delivery failed',
            code: 'EMAIL_DELIVERY_FAILED',
          },
          { status: 502 },
        );
      }),
    );

    const { toast } = await import('sonner');
    const { result } = renderHook(() => useSendInvoice());

    await act(async () => {
      await result.current.mutate('inv-uuid-1').catch(() => {
        // expected to throw
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.status).toBe(502);
    expect(result.current.error?.code).toBe('EMAIL_DELIVERY_FAILED');
    // i18next is not initialised in unit tests; t() returns the raw key
    expect(toast.error).toHaveBeenCalledWith('invoices.toast.sendFailed');
  });

  it('fires noRecipient toast on 422 INVOICE_HAS_NO_RECIPIENT', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Unprocessable Entity',
            status: 422,
            detail: 'Invoice has no recipient',
            code: 'INVOICE_HAS_NO_RECIPIENT',
          },
          { status: 422 },
        );
      }),
    );

    const { toast } = await import('sonner');
    const { result } = renderHook(() => useSendInvoice());

    await act(async () => {
      await result.current.mutate('inv-uuid-1').catch(() => {
        // expected to throw
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.status).toBe(422);
    expect(result.current.error?.code).toBe('INVOICE_HAS_NO_RECIPIENT');
    // i18next is not initialised in unit tests; t() returns the raw key
    expect(toast.error).toHaveBeenCalledWith('invoices.toast.noRecipient');
  });

  it('fires pdfConversionFailed toast on 502 PDF_CONVERSION_FAILED', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json(
          {
            type: 'about:blank',
            title: 'Bad Gateway',
            status: 502,
            detail: 'PDF conversion failed',
            code: 'PDF_CONVERSION_FAILED',
          },
          { status: 502 },
        );
      }),
    );

    const { toast } = await import('sonner');
    const { result } = renderHook(() => useSendInvoice());

    await act(async () => {
      await result.current.mutate('inv-uuid-1').catch(() => {
        // expected to throw
      });
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error?.status).toBe(502);
    expect(result.current.error?.code).toBe('PDF_CONVERSION_FAILED');
    // i18next is not initialised in unit tests; t() returns the raw key
    expect(toast.error).toHaveBeenCalledWith('invoices.toast.pdfConversionFailed');
  });

  it('does not call onSuccess on error', async () => {
    server.use(
      http.post('/api/v1/invoices/:id/send-email', () => {
        return HttpResponse.json({ status: 502, code: 'EMAIL_DELIVERY_FAILED' }, { status: 502 });
      }),
    );

    const onSuccess = vi.fn();
    const { result } = renderHook(() => useSendInvoice(onSuccess));

    await act(async () => {
      await result.current.mutate('inv-uuid-1').catch(() => {
        // expected
      });
    });

    expect(onSuccess).not.toHaveBeenCalled();
  });
});
