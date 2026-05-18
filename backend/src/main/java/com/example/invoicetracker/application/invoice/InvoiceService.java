package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.application.company.CompanyProfileResolver;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceNotEditableException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceNumberTakenException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for invoice use-cases: create, get, list, renderPdf, sendEmail, markAsPaid.
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
    private final CompanyProfileResolver companyProfileResolver;
    private final InvoiceArtifactService artifactService;

    /**
     * Constructs the service.
     *
     * @param invoiceRepository    invoice persistence port
     * @param clientRepository     client persistence port
     * @param pdfRenderer          PDF renderer
     * @param mailer               email sender
     * @param companyProfileResolver resolves the effective company properties
     * @param artifactService      artefact use-case service
     */
    public InvoiceService(
        InvoiceRepository invoiceRepository,
        ClientRepository clientRepository,
        InvoicePdfRenderer pdfRenderer,
        InvoiceMailer mailer,
        CompanyProfileResolver companyProfileResolver,
        InvoiceArtifactService artifactService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.pdfRenderer = pdfRenderer;
        this.mailer = mailer;
        this.companyProfileResolver = companyProfileResolver;
        this.artifactService = artifactService;
    }

    /**
     * Creates a new invoice with DRAFT status.
     * If {@code number} is null or blank, the server generates the next sequential number
     * for the current year using an advisory lock.
     * Snapshot fields are populated from the client at creation time.
     *
     * @param number     the invoice number (optional; null or blank triggers auto-generation)
     * @param clientId   the client UUID
     * @param issueDate  the issue date
     * @param dueDate    the due date
     * @param lines      the line items
     * @param taxRate    the tax rate (0-1)
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
        Client client = clientRepository.findByIdAndDeletedAtIsNull(clientId)
            .orElseThrow(() -> new ClientNotFoundException(clientId));
        String resolvedNumber = (number == null || number.isBlank())
            ? nextInvoiceNumber()
            : number;
        if (invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(resolvedNumber)) {
            throw new InvoiceNumberTakenException(resolvedNumber);
        }
        Instant now = Instant.now();
        Invoice invoice = new Invoice(
            UUID.randomUUID(),
            resolvedNumber,
            clientId,
            issueDate,
            dueDate,
            lines,
            taxRate,
            InvoiceStatus.DRAFT,
            null,
            now,
            now,
            null,
            client.email(),
            client.name(),
            client.address() != null ? client.address() : "",
            client.companyName(),
            client.companyAddress(),
            client.companyVatNumber(),
            client.companyIban(),
            client.companySwiftBic(),
            client.companyBankName()
        );
        Invoice saved = invoiceRepository.save(invoice);
        log.info("Invoice created: {}", saved.id());
        return saved;
    }

    /**
     * Updates an existing DRAFT invoice. Rejects non-DRAFT invoices with
     * {@link InvoiceNotEditableException}.
     * Always re-snapshots company details from the current client.
     *
     * @param id        the invoice UUID
     * @param number    the invoice number (if null or blank, the existing number is retained)
     * @param clientId  the client UUID
     * @param issueDate the issue date
     * @param dueDate   the due date
     * @param lines     the replacement line items
     * @param taxRate   the tax rate (0-1)
     * @return the updated invoice
     */
    public Invoice update(
        UUID id,
        String number,
        UUID clientId,
        LocalDate issueDate,
        LocalDate dueDate,
        List<InvoiceLine> lines,
        BigDecimal taxRate
    ) {
        Invoice existing = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        if (existing.status() != InvoiceStatus.DRAFT) {
            throw new InvoiceNotEditableException(id, existing.status());
        }
        Client client = clientRepository.findByIdAndDeletedAtIsNull(clientId)
            .orElseThrow(() -> new ClientNotFoundException(clientId));

        String resolvedNumber = (number == null || number.isBlank())
            ? existing.number()
            : number;

        // Check uniqueness only when the number is changing
        if (!resolvedNumber.equalsIgnoreCase(existing.number())
            && invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(resolvedNumber)) {
            throw new InvoiceNumberTakenException(resolvedNumber);
        }

        Instant now = Instant.now();
        Invoice updated = new Invoice(
            id,
            resolvedNumber,
            clientId,
            issueDate,
            dueDate,
            lines,
            taxRate,
            InvoiceStatus.DRAFT,
            existing.lastSentAt(),
            existing.createdAt(),
            now,
            null,
            client.email(),
            client.name(),
            client.address() != null ? client.address() : "",
            client.companyName(),
            client.companyAddress(),
            client.companyVatNumber(),
            client.companyIban(),
            client.companySwiftBic(),
            client.companyBankName()
        );
        Invoice saved = invoiceRepository.update(updated);
        log.info("Invoice updated: {}", id);
        return saved;
    }

    /**
     * Generates the next sequential invoice number for the current year.
     * Uses a Postgres advisory lock to prevent concurrent races.
     *
     * @return the generated number, e.g. {@code INV-2026-0001}
     */
    String nextInvoiceNumber() {
        int year = Year.now().getValue();
        String max = invoiceRepository.findMaxNumberForYear(year);
        int next;
        if (max == null) {
            next = 1;
        } else {
            // Format: INV-YYYY-NNNN  - last segment is the sequence
            String[] parts = max.split("-");
            next = Integer.parseInt(parts[parts.length - 1]) + 1;
        }
        return String.format("INV-%d-%04d", year, next);
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
            invoice.taxRate(), invoice.status(), invoice.lastSentAt(), invoice.createdAt(),
            invoice.updatedAt(), invoice.deletedAt(), email,
            invoice.clientNameSnapshot(), invoice.clientAddressSnapshot(),
            invoice.companyNameSnapshot(), invoice.companyAddressSnapshot(),
            invoice.companyVatSnapshot(), invoice.companyIbanSnapshot(),
            invoice.companySwiftSnapshot(), invoice.companyBankNameSnapshot()
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
        return pdfRenderer.render(invoice, client, companyProfileResolver.resolve());
    }

    /**
     * Sends the invoice PDF to the client's email address and records the send timestamp.
     * Sets status to SENT if it was DRAFT.
     *
     * @param id the invoice UUID
     * @return the invoice with updated lastSentAt and (possibly) SENT status
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

        // Prefer saved PDF artefact; fall back to live rendering if absent
        CompanyProperties resolved = companyProfileResolver.resolve();
        byte[] pdfBytes = artifactService.findPdfBytes(id)
            .orElseGet(() -> pdfRenderer.render(invoice, client, resolved));
        mailer.send(invoice, toEmail, pdfBytes, resolved, client.name());

        Instant sentAt = Instant.now();
        Invoice updated = invoiceRepository.markSent(id, sentAt);
        log.info("Invoice {} marked sent at {}", id, sentAt);

        // Transition DRAFT - SENT
        invoiceRepository.markSentIfDraft(id);
        log.info("Invoice {} status transitioned to SENT (if it was DRAFT)", id);
        return invoiceRepository.findByIdWithLines(id)
            .orElse(updated);
    }

    /**
     * Marks an invoice as PAID.
     *
     * @param id the invoice UUID
     * @return the updated invoice with PAID status
     * @throws InvoiceNotFoundException if not found or soft-deleted
     */
    public Invoice markAsPaid(UUID id) {
        Invoice updated = invoiceRepository.markPaid(id);
        log.info("Invoice {} marked as PAID", id);
        return updated;
    }

    /**
     * Soft-deletes an invoice and lazily removes all of its generated artefacts.
     *
     * @param id the invoice UUID
     * @throws InvoiceNotFoundException if not found or already soft-deleted
     */
    public void deleteInvoice(UUID id) {
        artifactService.deleteAll(id);
        invoiceRepository.softDelete(id);
        log.info("Invoice {} soft-deleted", id);
    }
}
