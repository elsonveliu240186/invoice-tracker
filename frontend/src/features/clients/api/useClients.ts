import { useState, useEffect, useCallback } from 'react';
import type { Client, ClientPage, ClientQuery, CreateClient, UpdateClient } from '../model/types';
import { listClients, getClient, createClient, updateClient, deleteClient } from './clientsApi';
import type { ApiError } from '@/shared/lib/http';

interface UseClientsResult {
  data: ClientPage | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useClients(query: ClientQuery = {}): UseClientsResult {
  const [data, setData] = useState<ClientPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  // Stable serialisation of query for the effect dependency
  const queryKey = JSON.stringify(query);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const parsed = JSON.parse(queryKey) as ClientQuery;
    listClients(parsed)
      .then((page) => {
        if (!cancelled) setData(page);
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
  }, [queryKey, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}

interface UseClientResult {
  data: Client | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

export function useClient(id: string | null): UseClientResult {
  const [data, setData] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getClient(id)
      .then((client) => {
        if (!cancelled) setData(client);
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
  }, [id, revision]);

  const refetch = useCallback(() => setRevision((r) => r + 1), []);

  return { data, loading, error, refetch };
}

interface MutationState<T> {
  loading: boolean;
  error: ApiError | null;
  data: T | null;
}

export function useCreateClient() {
  const [state, setState] = useState<MutationState<Client>>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (payload: CreateClient): Promise<Client> => {
    setState({ loading: true, error: null, data: null });
    try {
      const client = await createClient(payload);
      setState({ loading: false, error: null, data: client });
      return client;
    } catch (err) {
      const apiError = err as ApiError;
      setState({ loading: false, error: apiError, data: null });
      throw apiError;
    }
  }, []);

  return { ...state, mutate };
}

export function useUpdateClient() {
  const [state, setState] = useState<MutationState<Client>>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (id: string, payload: UpdateClient): Promise<Client> => {
    setState({ loading: true, error: null, data: null });
    try {
      const client = await updateClient(id, payload);
      setState({ loading: false, error: null, data: client });
      return client;
    } catch (err) {
      const apiError = err as ApiError;
      setState({ loading: false, error: apiError, data: null });
      throw apiError;
    }
  }, []);

  return { ...state, mutate };
}

export function useDeleteClient() {
  const [state, setState] = useState<MutationState<void>>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (id: string): Promise<void> => {
    setState({ loading: true, error: null, data: null });
    try {
      await deleteClient(id);
      setState({ loading: false, error: null, data: undefined });
    } catch (err) {
      const apiError = err as ApiError;
      setState({ loading: false, error: apiError, data: null });
      throw apiError;
    }
  }, []);

  return { ...state, mutate };
}
