export type ArtifactFormat = 'PDF' | 'DOCX';

export interface GeneratedArtifact {
  format: ArtifactFormat;
  generatedAt: string;
  sizeBytes: number;
  sha256: string;
}

export interface InvoiceArtifactsMetadata {
  pdf: GeneratedArtifact | null;
  docx: GeneratedArtifact | null;
}
