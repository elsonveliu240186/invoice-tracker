package com.example.invoicetracker.adapter.web.invoice;

import com.example.invoicetracker.adapter.web.invoice.dto.SendEmailResponse;
import com.example.invoicetracker.application.invoice.InvoiceRenderService;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller providing DOCX-template rendering endpoints for invoices.
 *
 * <p>Endpoints (all require HTTP Basic authentication):
 * <ul>
 *   <li>GET  /api/v1/invoices/{id}/docx       — merged DOCX download
 *   <li>GET  /api/v1/invoices/{id}/docx-pdf   — PDF via DOCX+LibreOffice pipeline
 *   <li>POST /api/v1/invoices/{id}/docx-email — render PDF via DOCX pipeline and email it
 * </ul>
 *
 * <p>The legacy PDF endpoint ({@code /api/v1/invoices/{id}/pdf}) remains in
 * {@link InvoiceController} but uses {@link DocxThenPdfInvoicePdfRenderer} (annotated
 * {@code @Primary}) so it also benefits from the new DOCX-template pipeline automatically.
 */
@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoice Rendering", description = "DOCX/PDF rendering and email delivery via template")
public class InvoiceRenderController {

    private static final String DOCX_MEDIA_TYPE =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private final InvoiceRenderService renderService;
    private final InvoiceRepository invoiceRepository;

    /**
     * Constructs the controller.
     *
     * @param renderService     the render service
     * @param invoiceRepository used to resolve invoice number for Content-Disposition
     */
    public InvoiceRenderController(
        InvoiceRenderService renderService,
        InvoiceRepository invoiceRepository
    ) {
        this.renderService = renderService;
        this.invoiceRepository = invoiceRepository;
    }

    /**
     * Streams the invoice as a merged DOCX document using the active template.
     *
     * @param id the invoice UUID
     * @return 200 with DOCX bytes and attachment Content-Disposition
     */
    @GetMapping(value = "/{id}/docx", produces = DOCX_MEDIA_TYPE)
    @Operation(summary = "Download invoice as a merged DOCX")
    public ResponseEntity<byte[]> getDocx(@PathVariable UUID id) {
        byte[] docxBytes = renderService.renderDocx(id);
        String invoiceNumber = resolveNumber(id);
        String filename = "invoice-" + invoiceNumber + ".docx";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .contentType(MediaType.parseMediaType(DOCX_MEDIA_TYPE))
            .contentLength(docxBytes.length)
            .body(docxBytes);
    }

    /**
     * Streams the invoice as a PDF generated via the DOCX template + LibreOffice pipeline.
     *
     * @param id the invoice UUID
     * @return 200 with PDF bytes and inline Content-Disposition
     */
    @GetMapping(value = "/{id}/docx-pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @Operation(summary = "Download invoice PDF via DOCX-template pipeline")
    public ResponseEntity<byte[]> getDocxPdf(@PathVariable UUID id) {
        byte[] pdfBytes = renderService.renderPdf(id);
        String invoiceNumber = resolveNumber(id);
        String filename = "invoice-" + invoiceNumber + ".pdf";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(pdfBytes.length)
            .body(pdfBytes);
    }

    /**
     * Renders the invoice as a PDF via the DOCX pipeline and emails it to the client.
     * On success, updates {@code last_sent_at}.
     *
     * @param id the invoice UUID
     * @return 200 with lastSentAt timestamp
     */
    @PostMapping("/{id}/docx-email")
    @Operation(summary = "Send invoice PDF by email via DOCX-template pipeline")
    public ResponseEntity<SendEmailResponse> sendDocxEmail(@PathVariable UUID id) {
        Instant sentAt = renderService.sendEmail(id);
        return ResponseEntity.ok(new SendEmailResponse(sentAt));
    }

    private String resolveNumber(UUID id) {
        return invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id))
            .number();
    }
}
