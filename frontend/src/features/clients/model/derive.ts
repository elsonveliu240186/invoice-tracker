import type { Client } from './types';

export type ClientStatus = 'ACTIVE' | 'INACTIVE';

/**
 * Derives a UI-only status from a client object.
 * The backend does not yet expose a `status` field, so we default to ACTIVE.
 * When the backend adds `status`, replace this function with a direct read.
 */
export function deriveStatus(client: Client): ClientStatus {
  const raw = (client as unknown as Record<string, unknown>)['status'];
  if (raw === 'INACTIVE') return 'INACTIVE';
  return 'ACTIVE';
}

/**
 * Formats an ISO date string to a locale-aware short date string.
 * Returns an empty string for empty or invalid input.
 */
export function formatDate(iso: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}
