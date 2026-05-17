import { http, httpRaw } from '@/shared/lib/http';
import type {
  ArtifactFormat,
  GeneratedArtifact,
  InvoiceArtifactsMetadata,
} from '../model/artifact';

const BASE = '/api/v1/invoices';

export async function getArtifactsMetadata(invoiceId: string): Promise<InvoiceArtifactsMetadata> {
  return http<InvoiceArtifactsMetadata>(`${BASE}/${invoiceId}/generated/metadata`);
}

export async function generateArtifact(
  invoiceId: string,
  format: ArtifactFormat,
  overwrite = false,
): Promise<GeneratedArtifact> {
  return http<GeneratedArtifact>(
    `${BASE}/${invoiceId}/generate?format=${format}&overwrite=${String(overwrite)}`,
    { method: 'POST' },
  );
}

async function triggerDownload(url: string, filename: string): Promise<void> {
  const response = await httpRaw(url);
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function downloadGeneratedArtifact(
  invoiceId: string,
  format: ArtifactFormat,
  filename: string,
): Promise<void> {
  return triggerDownload(`${BASE}/${invoiceId}/generated?format=${format}`, filename);
}

/**
 * Fetches the preview PDF as a blob and returns an object URL.
 * The caller is responsible for calling URL.revokeObjectURL when done.
 */
export async function getPreviewPdfBlobUrl(invoiceId: string): Promise<string> {
  const response = await httpRaw(`${BASE}/${invoiceId}/preview-pdf`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}
