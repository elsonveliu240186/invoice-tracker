import { http, httpRaw } from '@/shared/lib/http';
import type { TemplateMetadata, UploadTemplateResponse } from '../model/types';

const BASE = '/api/v1/settings/invoice-template';

export async function getTemplateMetadata(): Promise<TemplateMetadata> {
  return http<TemplateMetadata>(`${BASE}/preview`);
}

export async function uploadTemplate(file: File): Promise<UploadTemplateResponse> {
  const formData = new FormData();
  formData.append('file', file);
  const response = await httpRaw(BASE, { method: 'POST', body: formData });
  return response.json() as Promise<UploadTemplateResponse>;
}

export function getTemplateDownloadUrl(): string {
  return `${BASE}/download`;
}
