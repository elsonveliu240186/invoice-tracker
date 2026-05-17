import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/shared/lib/i18n';
import { GeneratedArtifactBadge } from './GeneratedArtifactBadge';
import type { InvoiceArtifactsMetadata } from '../model/artifact';

function renderBadge(metadata: InvoiceArtifactsMetadata | null) {
  return render(
    <I18nextProvider i18n={i18n}>
      <GeneratedArtifactBadge metadata={metadata} />
    </I18nextProvider>,
  );
}

const PDF_ARTIFACT = {
  format: 'PDF' as const,
  generatedAt: '2026-05-14T10:00:00Z',
  sizeBytes: 12345,
  sha256: 'abc',
};
const DOCX_ARTIFACT = {
  format: 'DOCX' as const,
  generatedAt: '2026-05-14T11:00:00Z',
  sizeBytes: 9876,
  sha256: 'def',
};

describe('GeneratedArtifactBadge', () => {
  it('renders nothing when metadata is null', () => {
    const { container } = renderBadge(null);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when both pdf and docx are null', () => {
    const { container } = renderBadge({ pdf: null, docx: null });
    expect(container.firstChild).toBeNull();
  });

  it('renders PDF badge when pdf is present', () => {
    renderBadge({ pdf: PDF_ARTIFACT, docx: null });
    expect(screen.getByTestId('badge-generated-pdf')).toBeInTheDocument();
    expect(screen.queryByTestId('badge-generated-docx')).not.toBeInTheDocument();
  });

  it('renders DOCX badge when docx is present', () => {
    renderBadge({ pdf: null, docx: DOCX_ARTIFACT });
    expect(screen.getByTestId('badge-generated-docx')).toBeInTheDocument();
    expect(screen.queryByTestId('badge-generated-pdf')).not.toBeInTheDocument();
  });

  it('renders both badges when pdf and docx are present', () => {
    renderBadge({ pdf: PDF_ARTIFACT, docx: DOCX_ARTIFACT });
    expect(screen.getByTestId('badge-generated-pdf')).toBeInTheDocument();
    expect(screen.getByTestId('badge-generated-docx')).toBeInTheDocument();
  });

  it('shows date in PDF badge text', () => {
    renderBadge({ pdf: PDF_ARTIFACT, docx: null });
    expect(screen.getByTestId('badge-generated-pdf').textContent).toContain('2026');
  });

  it('renders wrapper testid when at least one artifact present', () => {
    renderBadge({ pdf: PDF_ARTIFACT, docx: null });
    expect(screen.getByTestId('generated-artifact-badge')).toBeInTheDocument();
  });
});
