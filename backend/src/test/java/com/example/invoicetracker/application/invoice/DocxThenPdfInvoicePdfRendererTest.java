package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.domain.invoice.PdfConversionFailedException;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link DocxThenPdfInvoicePdfRenderer}.
 */
@ExtendWith(MockitoExtension.class)
class DocxThenPdfInvoicePdfRendererTest {

    @Mock
    InvoiceDocxRenderer docxRenderer;

    @Mock
    InvoicePdfConverter pdfConverter;

    @InjectMocks
    DocxThenPdfInvoicePdfRenderer renderer;

    @Test
    void composes_renderer_and_converter() {
        var invoice = InvoiceFixtures.invoice(UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        byte[] docxBytes = "fake-docx".getBytes();
        byte[] pdfBytes = "%PDF-1.4 fake".getBytes();

        when(docxRenderer.render(any(), any(), any())).thenReturn(docxBytes);
        when(pdfConverter.convert(docxBytes)).thenReturn(pdfBytes);

        byte[] result = renderer.render(invoice, client, company);

        assertThat(result).isEqualTo(pdfBytes);
    }

    @Test
    void converter_exception_propagates() {
        var invoice = InvoiceFixtures.invoice(UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        when(docxRenderer.render(any(), any(), any())).thenReturn("docx".getBytes());
        when(pdfConverter.convert(any()))
            .thenThrow(new PdfConversionFailedException("soffice failed"));

        assertThatThrownBy(() -> renderer.render(invoice, client, company))
            .isInstanceOf(PdfConversionFailedException.class)
            .hasMessageContaining("soffice failed");
    }

    @Test
    void docx_renderer_exception_propagates() {
        var invoice = InvoiceFixtures.invoice(UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        when(docxRenderer.render(any(), any(), any()))
            .thenThrow(new IllegalStateException("template missing"));

        assertThatThrownBy(() -> renderer.render(invoice, client, company))
            .isInstanceOf(IllegalStateException.class);
    }
}
