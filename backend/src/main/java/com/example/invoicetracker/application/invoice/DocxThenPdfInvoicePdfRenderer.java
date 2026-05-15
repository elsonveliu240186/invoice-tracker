package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * {@link InvoicePdfRenderer} implementation that composes
 * {@link InvoiceDocxRenderer} and {@link InvoicePdfConverter}.
 *
 * <p>Annotated {@code @Primary} so it wins over any other {@link InvoicePdfRenderer}
 * bean (e.g. the legacy {@link OpenPdfInvoiceRenderer} registered by FEAT-02).
 */
@Component
@Primary
public class DocxThenPdfInvoicePdfRenderer implements InvoicePdfRenderer {

    private final InvoiceDocxRenderer docxRenderer;
    private final InvoicePdfConverter pdfConverter;

    /**
     * Constructs the composed renderer.
     *
     * @param docxRenderer the DOCX merge renderer
     * @param pdfConverter the LibreOffice PDF converter
     */
    public DocxThenPdfInvoicePdfRenderer(
        InvoiceDocxRenderer docxRenderer,
        InvoicePdfConverter pdfConverter
    ) {
        this.docxRenderer = docxRenderer;
        this.pdfConverter = pdfConverter;
    }

    @Override
    public byte[] render(Invoice invoice, Client client, CompanyProperties company) {
        byte[] docxBytes = docxRenderer.render(invoice, client, company);
        return pdfConverter.convert(docxBytes);
    }
}
