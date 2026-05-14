package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceNumberTakenException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for invoice use-cases: create, get, list, renderPdf, sendEmail.
 */
@Service
@Transactional
public class InvoiceService {

    /**
     * Result of rendering a PDF: the bytes and the invoice number for the Content-Disposition
     * header (avoids a second DB fetch in the controller).
     *
     * @param bytes         the rendered PDF bytes
     * @param invoiceNumber the invoice number used to name the attachment
     */
    public record PdfResult(byte[] bytes, String invoiceNumber) {}

    private static final Logger log = LoggerFactory.getLogger(InvoiceService.class);

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final InvoicePdfRenderer pdfRenderer;
    private final InvoiceMailer mailer;
    private final CompanyProperties companyProperties;

    public InvoiceService(
        InvoiceRepository invoiceRepository,
        ClientRepository clientRepository,
        InvoicePdfRenderer pdfRenderer,
        InvoiceMailer mailer,
        CompanyProperties companyProperties
    ) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.pdfRenderer = pdfRenderer;
        this.mailer = mailer;
        this.companyProperties = companyProperties;
    }

    /**
     * Creates a new invoice.
     *
     * @param number     the invoice number (must be unique)
     * @param clientId   the client UUID
     * @param issueDate  the issue date
     * @param dueDate    the due date
     * @param lines      the line items
     * @param taxRate    the tax rate (0–1)
     * @return the created invoice
     */
    public Invoice create(
        String number,
        UUID clientId,
        LocalDate issueDate,
        LocalDate dueDate,
        List<InvoiceLine> lines,
        BigDecimal taxRate
    ) {
        clientRepository.findByIdAndDeletedAtIsNull(clientId)
            .orElseThrow(() -> new ClientNotFoundException(clientId));
        if (invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(number)) {
            throw new InvoiceNumberTakenException(number);
        }
        Instant now = Instant.now();
        Invoice invoice = new Invoice(
            UUID.randomUUID(),
            number,
            clientId,
            issueDate,
            dueDate,
            lines,
            taxRate,
            null,
            now,
            now,
            null,
            null
        );
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice created: {}", saved.id());
        return saved;
    }

    /**
     * Retrieves an invoice by ID, enriched with the client's email address.
     *
     * @param id the invoice UUID
     * @return the invoice (clientEmail populated from the associated client)
     * @throws InvoiceNotFoundException if not found or soft-deleted
     */
    @Transactional(readOnly = true)
    public Invoice get(UUID id) {
        Invoice invoice = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        String email = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .map(c -> c.email())
            .orElse(null);
        return new Invoice(
            invoice.id(), invoice.number(), invoice.clientId(),
            invoice.issueDate(), invoice.dueDate(), invoice.lines(),
            invoice.taxRate(), invoice.lastSentAt(), invoice.createdAt(),
            invoice.updatedAt(), invoice.deletedAt(), email
        );
    }

    /**
     * Lists invoices with optional client filter.
     *
     * @param clientId optional client UUID filter
     * @param pageable pagination parameters
     * @return a page of invoices
     */
    @Transactional(readOnly = true)
    public Page<Invoice> list(UUID clientId, Pageable pageable) {
        return invoiceRepository.findAll(clientId, pageable);
    }

    /**
     * Renders the invoice as a PDF byte array.
     *
     * @param id the invoice UUID
     * @return the PDF bytes
     * @throws InvoiceNotFoundException if the invoice is not found
     */
    @Transactional(readOnly = true)
    public byte[] renderPdf(UUID id) {
        Invoice invoice = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));
        return pdfRenderer.render(invoice, client, companyProperties);
    }

    /**
     * Sends the invoice PDF to the client's email address and records the send timestamp.
     *
     * @param id the invoice UUID
     * @return the invoice with updated lastSentAt
     * @throws InvoiceNotFoundException      if not found
     * @throws InvoiceHasNoRecipientException if the client has no email
     * @throws com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException
     *         if SMTP delivery fails
     */
    public Invoice sendEmail(UUID id) {
        Invoice invoice = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));

        String toEmail = client.email();
        if (toEmail == null || toEmail.isBlank()
                || toEmail.contains("\r") || toEmail.contains("\n")) {
            throw new InvoiceHasNoRecipientException(id);
        }

        byte[] pdfBytes = pdfRenderer.render(invoice, client, companyProperties);
        mailer.send(invoice, toEmail, pdfBytes, companyProperties, client.name());

        Instant sentAt = Instant.now();
        Invoice updated = invoiceRepository.markSent(id, sentAt);
        log.info("Invoice {} marked sent at {}", id, sentAt);
        return updated;
    }
}
