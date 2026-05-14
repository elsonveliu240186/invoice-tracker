package com.example.invoicetracker.adapter.web.invoice;

import com.example.invoicetracker.adapter.web.client.dto.PageResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.CreateInvoiceLineRequest;
import com.example.invoicetracker.adapter.web.invoice.dto.CreateInvoiceRequest;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceLineDto;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.SendEmailResponse;
import com.example.invoicetracker.application.invoice.InvoiceService;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * REST controller for invoice endpoints at /api/v1/invoices.
 */
@RestController
@RequestMapping("/api/v1/invoices")
@Tag(name = "Invoices", description = "Invoice management, PDF generation and email delivery")
public class InvoiceController {

    private final InvoiceService invoiceService;

    public InvoiceController(InvoiceService invoiceService) {
        this.invoiceService = invoiceService;
    }

    /**
     * Creates a new invoice.
     *
     * @param request the create request body
     * @return 201 Created with the invoice response and Location header
     */
    @PostMapping
    @Operation(summary = "Create a new invoice")
    public ResponseEntity<InvoiceResponse> create(@Valid @RequestBody CreateInvoiceRequest request) {
        List<InvoiceLine> lines = toInvoiceLines(request.lines());
        Invoice invoice = invoiceService.create(
            request.number(),
            request.clientId(),
            request.issueDate(),
            request.dueDate(),
            lines,
            request.taxRate()
        );
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(invoice.id())
            .toUri();
        return ResponseEntity.created(location).body(toResponse(invoice));
    }

    /**
     * Lists invoices with optional client filter and pagination.
     *
     * @param clientId optional client UUID filter
     * @param pageable pagination parameters
     * @return 200 with paginated invoice list
     */
    @GetMapping
    @Operation(summary = "List invoices")
    public ResponseEntity<PageResponse<InvoiceResponse>> list(
        @RequestParam(required = false) UUID clientId,
        @PageableDefault(size = 20, sort = "createdAt") Pageable pageable
    ) {
        Page<Invoice> page = invoiceService.list(clientId, pageable);
        List<InvoiceResponse> content = page.getContent().stream()
            .map(this::toResponse)
            .toList();
        PageResponse<InvoiceResponse> response = new PageResponse<>(
            content,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a single invoice by ID.
     *
     * @param id the invoice UUID
     * @return 200 with the invoice, or 404 if not found
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get an invoice by ID")
    public ResponseEntity<InvoiceResponse> get(@PathVariable UUID id) {
        Invoice invoice = invoiceService.get(id);
        return ResponseEntity.ok(toResponse(invoice));
    }

    /**
     * Streams the invoice as a PDF document.
     *
     * @param id the invoice UUID
     * @return 200 with application/pdf content
     */
    @GetMapping(value = "/{id}/pdf", produces = "application/pdf")
    @Operation(summary = "Download invoice as PDF")
    public ResponseEntity<byte[]> getPdf(@PathVariable UUID id) {
        byte[] pdfBytes = invoiceService.renderPdf(id);
        Invoice invoice = invoiceService.get(id);
        String filename = "invoice-" + invoice.number() + ".pdf";
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .contentType(MediaType.APPLICATION_PDF)
            .contentLength(pdfBytes.length)
            .body(pdfBytes);
    }

    /**
     * Sends the invoice PDF to the client's email address.
     *
     * @param id the invoice UUID
     * @return 200 with lastSentAt timestamp, or 502 on SMTP failure
     */
    @PostMapping("/{id}/send-email")
    @Operation(summary = "Send invoice by email to client")
    public ResponseEntity<SendEmailResponse> sendEmail(@PathVariable UUID id) {
        Invoice updated = invoiceService.sendEmail(id);
        return ResponseEntity.ok(new SendEmailResponse(updated.lastSentAt()));
    }

    private InvoiceResponse toResponse(Invoice invoice) {
        List<InvoiceLineDto> lineDtos = invoice.lines().stream()
            .map(l -> new InvoiceLineDto(l.id(), l.description(), l.quantity(),
                l.unitPrice(), l.lineTotal()))
            .toList();
        return new InvoiceResponse(
            invoice.id(),
            invoice.number(),
            invoice.clientId(),
            invoice.clientEmail(),
            invoice.issueDate(),
            invoice.dueDate(),
            lineDtos,
            invoice.taxRate(),
            invoice.subtotal(),
            invoice.total(),
            invoice.lastSentAt(),
            invoice.createdAt(),
            invoice.updatedAt()
        );
    }

    private List<InvoiceLine> toInvoiceLines(List<CreateInvoiceLineRequest> requests) {
        int pos = 0;
        List<InvoiceLine> lines = new ArrayList<>();
        for (CreateInvoiceLineRequest req : requests) {
            lines.add(new InvoiceLine(UUID.randomUUID(), req.description(),
                req.quantity(), req.unitPrice(), pos++));
        }
        return lines;
    }
}
