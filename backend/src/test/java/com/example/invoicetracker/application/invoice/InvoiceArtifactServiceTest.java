package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceArtifactsMetadataResponse;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.ArtifactAlreadyExistsException;
import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import com.example.invoicetracker.domain.invoice.ArtifactTooLargeException;
import com.example.invoicetracker.domain.invoice.GeneratedArtifact;
import com.example.invoicetracker.domain.invoice.GeneratedArtifactNotFoundException;
import com.example.invoicetracker.domain.invoice.GeneratedArtifactRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.io.IOException;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoiceArtifactServiceTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private InvoiceDocxRenderer docxRenderer;
    @Mock
    private InvoicePdfRenderer pdfRenderer;
    @Mock
    private GeneratedArtifactStore store;
    @Mock
    private GeneratedArtifactRepository artifactRepository;

    private InvoiceArtifactService service;
    private UUID invoiceId;
    private UUID clientId;
    private Invoice sampleInvoice;
    private Client sampleClient;

    @BeforeEach
    void setUp() {
        GeneratedArtifactProperties props =
            new GeneratedArtifactProperties(Path.of("./generated/invoices"), 26_214_400L, true);
        service = new InvoiceArtifactService(
            invoiceRepository, clientRepository, docxRenderer, pdfRenderer,
            store, artifactRepository, props, InvoiceFixtures.company()
        );
        invoiceId = UUID.randomUUID();
        clientId = UUID.randomUUID();
        sampleInvoice = InvoiceFixtures.invoice(invoiceId, clientId);
        sampleClient = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
    }

    // ===== previewPdf =====

    @Test
    void preview_uses_live_renderer_and_never_persists() throws Exception {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(pdfRenderer.render(any(), any(), any())).thenReturn("pdf".getBytes());

        byte[] result = service.previewPdf(invoiceId);

        assertThat(result).isEqualTo("pdf".getBytes());
        verify(pdfRenderer).render(eq(sampleInvoice), eq(sampleClient), any());
        verify(artifactRepository, never()).upsert(any());
        verify(store, never()).write(any(), any(), any());
    }

    @Test
    void preview_throws_when_invoice_not_found() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.previewPdf(invoiceId))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    // ===== generate =====

    @Test
    void generate_pdf_persists_row_and_writes_file() throws IOException {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(Optional.empty());
        when(pdfRenderer.render(any(), any(), any())).thenReturn("pdf-bytes".getBytes());
        when(store.write(invoiceId, ArtifactFormat.PDF, "pdf-bytes".getBytes()))
            .thenReturn("some-id.pdf");
        GeneratedArtifact saved = artifact(invoiceId, ArtifactFormat.PDF, "some-id.pdf", 9L);
        when(artifactRepository.upsert(any())).thenReturn(saved);

        GeneratedArtifact result = service.generate(invoiceId, ArtifactFormat.PDF, false);

        assertThat(result.format()).isEqualTo(ArtifactFormat.PDF);
        assertThat(result.relativePath()).isEqualTo("some-id.pdf");
        verify(store).write(eq(invoiceId), eq(ArtifactFormat.PDF), any());
        verify(artifactRepository).upsert(any());
    }

    @Test
    void generate_docx_calls_docx_renderer() throws IOException {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(artifactRepository.find(invoiceId, ArtifactFormat.DOCX)).thenReturn(Optional.empty());
        when(docxRenderer.render(any(), any(), any())).thenReturn("docx-bytes".getBytes());
        when(store.write(invoiceId, ArtifactFormat.DOCX, "docx-bytes".getBytes()))
            .thenReturn("some-id.docx");
        GeneratedArtifact saved = artifact(invoiceId, ArtifactFormat.DOCX, "some-id.docx", 10L);
        when(artifactRepository.upsert(any())).thenReturn(saved);

        GeneratedArtifact result = service.generate(invoiceId, ArtifactFormat.DOCX, false);

        assertThat(result.format()).isEqualTo(ArtifactFormat.DOCX);
        verify(docxRenderer).render(any(), any(), any());
        verify(pdfRenderer, never()).render(any(), any(), any());
    }

    @Test
    void generate_throws_when_overwrite_false_and_row_exists() throws Exception {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        GeneratedArtifact existing = artifact(invoiceId, ArtifactFormat.PDF, "old.pdf", 5L);
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(
            Optional.of(existing));

        assertThatThrownBy(() -> service.generate(invoiceId, ArtifactFormat.PDF, false))
            .isInstanceOf(ArtifactAlreadyExistsException.class);
        verify(store, never()).write(any(), any(), any());
    }

    @Test
    void generate_with_overwrite_true_soft_deletes_old_then_writes() throws IOException {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        GeneratedArtifact existing = artifact(invoiceId, ArtifactFormat.PDF, "old.pdf", 5L);
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(
            Optional.of(existing));
        when(pdfRenderer.render(any(), any(), any())).thenReturn("new-pdf".getBytes());
        when(store.write(any(), any(), any())).thenReturn("new.pdf");
        GeneratedArtifact saved = artifact(invoiceId, ArtifactFormat.PDF, "new.pdf", 7L);
        when(artifactRepository.upsert(any())).thenReturn(saved);

        GeneratedArtifact result = service.generate(invoiceId, ArtifactFormat.PDF, true);

        verify(artifactRepository).softDeleteByInvoice(invoiceId);
        assertThat(result.relativePath()).isEqualTo("new.pdf");
    }

    @Test
    void generate_rejects_bytes_above_max_size() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(Optional.empty());
        byte[] oversized = new byte[30_000_000];
        when(pdfRenderer.render(any(), any(), any())).thenReturn(oversized);

        assertThatThrownBy(() -> service.generate(invoiceId, ArtifactFormat.PDF, false))
            .isInstanceOf(ArtifactTooLargeException.class);
    }

    // ===== streamGenerated =====

    @Test
    void streamGenerated_returns_bytes_when_row_present() throws IOException {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        GeneratedArtifact artifact = artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 4L);
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(
            Optional.of(artifact));
        when(store.read("inv.pdf")).thenReturn("pdf-content".getBytes());

        byte[] result = service.streamGenerated(invoiceId, ArtifactFormat.PDF);

        assertThat(result).isEqualTo("pdf-content".getBytes());
        verify(store).read("inv.pdf");
    }

    @Test
    void streamGenerated_throws_404_when_missing() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.streamGenerated(invoiceId, ArtifactFormat.PDF))
            .isInstanceOf(GeneratedArtifactNotFoundException.class);
    }

    @Test
    void streamGenerated_throws_invoice_not_found_when_invoice_missing() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.streamGenerated(invoiceId, ArtifactFormat.PDF))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    // ===== metadata =====

    @Test
    void metadata_returns_both_nulls_when_none_generated() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        when(artifactRepository.findAllByInvoice(invoiceId)).thenReturn(List.of());

        InvoiceArtifactsMetadataResponse resp = service.metadata(invoiceId);

        assertThat(resp.pdf()).isNull();
        assertThat(resp.docx()).isNull();
    }

    @Test
    void metadata_returns_pdf_entry_when_pdf_generated() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(sampleInvoice));
        GeneratedArtifact pdfArtifact = artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 100L);
        when(artifactRepository.findAllByInvoice(invoiceId)).thenReturn(List.of(pdfArtifact));

        InvoiceArtifactsMetadataResponse resp = service.metadata(invoiceId);

        assertThat(resp.pdf()).isNotNull();
        assertThat(resp.pdf().format()).isEqualTo("PDF");
        assertThat(resp.docx()).isNull();
    }

    @Test
    void metadata_throws_when_invoice_not_found() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.metadata(invoiceId))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    // ===== deleteAll =====

    @Test
    void deleteAll_removes_files_and_marks_rows_deleted() throws IOException {
        GeneratedArtifact pdfArtifact = artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 50L);
        GeneratedArtifact docxArtifact =
            artifact(invoiceId, ArtifactFormat.DOCX, "inv.docx", 60L);
        when(artifactRepository.findAllByInvoice(invoiceId)).thenReturn(
            List.of(pdfArtifact, docxArtifact));

        service.deleteAll(invoiceId);

        verify(artifactRepository).softDeleteByInvoice(invoiceId);
        verify(store).delete("inv.pdf");
        verify(store).delete("inv.docx");
    }

    @Test
    void deleteAll_continues_when_file_delete_fails() throws IOException {
        GeneratedArtifact pdfArtifact = artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 50L);
        when(artifactRepository.findAllByInvoice(invoiceId)).thenReturn(List.of(pdfArtifact));
        doThrow(new IOException("disk error — swallowed")).when(store).delete("inv.pdf");

        // must not propagate
        service.deleteAll(invoiceId);

        verify(artifactRepository).softDeleteByInvoice(invoiceId);
    }

    // ===== findPdfBytes =====

    @Test
    void findPdfBytes_returns_bytes_when_saved() throws IOException {
        GeneratedArtifact pdfArtifact = artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 20L);
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(
            Optional.of(pdfArtifact));
        when(store.read("inv.pdf")).thenReturn("bytes".getBytes());

        Optional<byte[]> result = service.findPdfBytes(invoiceId);

        assertThat(result).isPresent();
        assertThat(result.get()).isEqualTo("bytes".getBytes());
    }

    @Test
    void findPdfBytes_returns_empty_when_not_saved() {
        when(artifactRepository.find(invoiceId, ArtifactFormat.PDF)).thenReturn(Optional.empty());

        assertThat(service.findPdfBytes(invoiceId)).isEmpty();
    }

    // ===== helpers =====

    private static GeneratedArtifact artifact(
            UUID invoiceId, ArtifactFormat format, String path, long size) {
        return new GeneratedArtifact(
            UUID.randomUUID(), invoiceId, format, path, size,
            "a".repeat(64), Instant.now(), null
        );
    }
}
