import { useState, useEffect, useCallback } from 'react';
import type { TemplateMetadata } from '../model/types';
import { getTemplateMetadata } from './templateApi';
import type { ApiError } from '@/shared/lib/http';

interface UseTemplateMetadataResult {
  data: TemplateMetadata | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useTemplateMetadata(): UseTemplateMetadataResult {
  const [data, setData] = useState<TemplateMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    getTemplateMetadata()
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
  }, [revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}
