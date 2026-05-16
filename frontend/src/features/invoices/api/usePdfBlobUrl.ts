import { useState, useEffect } from 'react';
import { httpRaw } from '@/shared/lib/http';

const BASE = '/api/v1/invoices';

/**
 * Fetches the invoice preview PDF with auth headers and returns a blob URL
 * suitable for use in an <iframe src>. The blob URL is revoked on cleanup.
 */
export function usePdfBlobUrl(invoiceId: string, enabled: boolean) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let objectUrl: string | null = null;
    let cancelled = false;

    setLoading(true);
    setError(false);

    httpRaw(`${BASE}/${invoiceId}/preview-pdf`)
      .then((res) => res.blob())
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setBlobUrl(null);
    };
  }, [invoiceId, enabled]);

  return { blobUrl, loading, error };
}
