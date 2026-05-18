import { useState, useEffect } from 'react';
import { httpRaw } from '@/shared/lib/http';

/**
 * Fetches a PDF with auth headers and returns a blob URL suitable for use in
 * an <iframe src>. The blob URL is revoked on cleanup.
 *
 * @param url     Full API path to fetch (e.g. `/api/v1/invoices/{id}/pdf`)
 * @param enabled Whether to trigger the fetch (e.g. dialog open state)
 */
export function usePdfBlobUrl(url: string, enabled: boolean) {
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

    httpRaw(url)
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
  }, [url, enabled]);

  return { blobUrl, loading, error };
}
