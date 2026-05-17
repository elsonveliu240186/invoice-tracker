import { useState, useEffect, useCallback } from 'react';
import type { InvoiceArtifactsMetadata } from '../model/artifact';
import { getArtifactsMetadata } from './generatedArtifactApi';
import type { ApiError } from '@/shared/lib/http';

interface UseGeneratedArtifactsMetadataResult {
  data: InvoiceArtifactsMetadata | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useGeneratedArtifactsMetadata(
  invoiceId: string | null,
): UseGeneratedArtifactsMetadataResult {
  const [data, setData] = useState<InvoiceArtifactsMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!invoiceId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getArtifactsMetadata(invoiceId)
      .then((metadata) => {
        if (!cancelled) setData(metadata);
      })
      .catch((err: ApiError) => {
        if (!cancelled) setError(err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [invoiceId, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
