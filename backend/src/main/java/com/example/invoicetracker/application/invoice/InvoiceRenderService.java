package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.application.company.CompanyProfileResolver;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service providing the render/email use-cases introduced in FEAT-20260513-03.
 *
 * <ul>
 *   <li>{@link #renderDocx(UUID)} — merges the active template with invoice data
 *   <li>{@link #renderPdf(UUID)} — renders DOCX then converts to PDF via LibreOffice
 *   <li>{@link #sendEmail(UUID)} — renders PDF, emails it, and updates {@code last_sent_at}
 * </ul>
 */
@Service
public class InvoiceRenderService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceRenderService.class);

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final InvoiceDocxRenderer docxRenderer;
    private final InvoicePdfRenderer pdfRenderer;
    private final InvoiceMailer mailer;
    private final CompanyProfileResolver companyProfileResolver;
    private final InvoiceArtifactService artifactService;

    /**
     * Constructs the service with its dependencies.
     *
     * @param invoiceRepository    invoice persistence port
     * @param clientRepository     client persistence port
     * @param docxRenderer         DOCX renderer
     * @param pdfRenderer          PDF renderer (DocxThenPdfInvoicePdfRenderer via @Primary)
     * @param mailer               email sender
     * @param companyProfileResolver resolves the effective company properties
     * @param artifactService      artefact use-case service
     */
    public InvoiceRenderService(
        InvoiceRepository invoiceRepository,
        ClientRepository clientRepository,
        InvoiceDocxRenderer docxRenderer,
        InvoicePdfRenderer pdfRenderer,
        InvoiceMailer mailer,
        CompanyProfileResolver companyProfileResolver,
        InvoiceArtifactService artifactService
    ) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.docxRenderer = docxRenderer;
        this.pdfRenderer = pdfRenderer;
        this.mailer = mailer;
        this.companyProfileResolver = companyProfileResolver;
        this.artifactService = artifactService;
    }

    /**
     * Renders the invoice as a merged DOCX byte array.
     *
     * @param id the invoice UUID
     * @return the DOCX bytes
     * @throws InvoiceNotFoundException if the invoice does not exist
     */
    @Transactional(readOnly = true)
    public byte[] renderDocx(UUID id) {
        var invoice = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));
        return docxRenderer.render(invoice, client, companyProfileResolver.resolve());
    }

    /**
     * Renders the invoice as a PDF byte array.
     *
     * @param id the invoice UUID
     * @return the PDF bytes
     * @throws InvoiceNotFoundException if the invoice does not exist
     * @throws com.example.invoicetracker.domain.invoice.PdfConversionFailedException
     *         if LibreOffice conversion fails
     */
    @Transactional(readOnly = true)
    public byte[] renderPdf(UUID id) {
        var invoice = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));
        return pdfRenderer.render(invoice, client, companyProfileResolver.resolve());
    }

    /**
     * Renders the invoice as a PDF, emails it to the client, and records {@code last_sent_at}.
     *
     * <p>If PDF conversion or SMTP delivery fails, {@code last_sent_at} is NOT updated.
     *
     * @param id the invoice UUID
     * @return the {@code last_sent_at} timestamp recorded after successful delivery
     * @throws InvoiceNotFoundException       if the invoice does not exist
     * @throws InvoiceHasNoRecipientException if the client has no email address
     * @throws com.example.invoicetracker.domain.invoice.PdfConversionFailedException
     *         if LibreOffice conversion fails
     * @throws EmailDeliveryFailedException   if SMTP delivery fails
     */
    @Transactional
    public Instant sendEmail(UUID id) {
        var invoice = invoiceRepository.findByIdWithLines(id)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));

        String toEmail = client.email();
        if (toEmail == null || toEmail.isBlank()) {
            throw new InvoiceHasNoRecipientException(id);
        }

        // CRLF guard — prevents SMTP header injection
        if (toEmail.contains("\r") || toEmail.contains("\n")) {
            throw new InvoiceHasNoRecipientException(id);
        }

        // Prefer saved PDF artefact; fall back to live rendering if absent
        CompanyProperties resolved = companyProfileResolver.resolve();
        byte[] pdfBytes = artifactService.findPdfBytes(id)
            .orElseGet(() -> pdfRenderer.render(invoice, client, resolved));

        // SMTP delivery throws EmailDeliveryFailedException on failure — no lastSentAt written
        mailer.send(invoice, toEmail, pdfBytes, resolved, client.name());

        Instant sentAt = Instant.now();
        invoiceRepository.markSent(id, sentAt);
        log.info("Invoice {} sent at {}", id, sentAt);
        return sentAt;
    }
}
