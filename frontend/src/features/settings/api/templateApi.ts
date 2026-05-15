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

export async function downloadTemplate(): Promise<void> {
  const response = await httpRaw(`${BASE}/download`);
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'invoice-template.docx';
  a.click();
  URL.revokeObjectURL(url);
}
