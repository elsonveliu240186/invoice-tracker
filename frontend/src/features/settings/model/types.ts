export interface TemplateMetadata {
  filename: string;
  size: number;
  uploadedAt: string;
  isDefault: boolean;
}

export interface UploadTemplateResponse {
  filename: string;
  size: number;
  uploadedAt: string;
}
