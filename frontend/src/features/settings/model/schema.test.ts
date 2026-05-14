import { describe, it, expect } from 'vitest';
import { templateMetadataSchema, uploadTemplateResponseSchema } from './schema';

describe('templateMetadataSchema', () => {
  const validMetadata = {
    filename: 'invoice-template.docx',
    size: 12345,
    uploadedAt: '2026-05-13T20:10:00Z',
    isDefault: false,
  };

  it('accepts a valid metadata object', () => {
    const result = templateMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('accepts isDefault=true', () => {
    const result = templateMetadataSchema.safeParse({ ...validMetadata, isDefault: true });
    expect(result.success).toBe(true);
  });

  it('rejects missing filename', () => {
    const result = templateMetadataSchema.safeParse({ ...validMetadata, filename: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects empty filename', () => {
    const result = templateMetadataSchema.safeParse({ ...validMetadata, filename: '' });
    expect(result.success).toBe(false);
  });

  it('rejects negative size', () => {
    const result = templateMetadataSchema.safeParse({ ...validMetadata, size: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid uploadedAt format', () => {
    const result = templateMetadataSchema.safeParse({
      ...validMetadata,
      uploadedAt: 'not-a-date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing isDefault', () => {
    const result = templateMetadataSchema.safeParse({ ...validMetadata, isDefault: undefined });
    expect(result.success).toBe(false);
  });

  it('accepts size of zero', () => {
    const result = templateMetadataSchema.safeParse({ ...validMetadata, size: 0 });
    expect(result.success).toBe(true);
  });
});

describe('uploadTemplateResponseSchema', () => {
  const validResponse = {
    filename: 'invoice-template.docx',
    size: 12345,
    uploadedAt: '2026-05-13T20:10:00Z',
  };

  it('accepts a valid upload response', () => {
    const result = uploadTemplateResponseSchema.safeParse(validResponse);
    expect(result.success).toBe(true);
  });

  it('rejects missing filename', () => {
    const result = uploadTemplateResponseSchema.safeParse({
      ...validResponse,
      filename: undefined,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative size', () => {
    const result = uploadTemplateResponseSchema.safeParse({ ...validResponse, size: -5 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid date string', () => {
    const result = uploadTemplateResponseSchema.safeParse({
      ...validResponse,
      uploadedAt: '2026-13-01',
    });
    expect(result.success).toBe(false);
  });
});
