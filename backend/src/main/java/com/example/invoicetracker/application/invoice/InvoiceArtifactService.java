package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.adapter.web.invoice.dto.GeneratedArtifactResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceArtifactsMetadataResponse;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
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
import java.io.IOException;
import java.io.UncheckedIOException;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Use-case service for invoice artefact lifecycle:
 * preview, generate &amp; save, stream, metadata, and delete.
 */
@Service
public class InvoiceArtifactService {

    private static final Logger log = LoggerFactory.getLogger(InvoiceArtifactService.class);

    private final InvoiceRepository invoiceRepository;
    private final ClientRepository clientRepository;
    private final InvoiceDocxRenderer docxRenderer;
    private final InvoicePdfRenderer pdfRenderer;
    private final GeneratedArtifactStore store;
    private final GeneratedArtifactRepository artifactRepository;
    private final GeneratedArtifactProperties props;
    private final CompanyProperties companyProperties;

    /**
     * Constructs the service.
     *
     * @param invoiceRepository  invoice persistence port
     * @param clientRepository   client persistence port
     * @param docxRenderer       DOCX renderer
     * @param pdfRenderer        PDF renderer
     * @param store              artefact filesystem store
     * @param artifactRepository artefact persistence port
     * @param props              artefact configuration
     * @param companyProperties  company configuration
     */
    public InvoiceArtifactService(
        InvoiceRepository invoiceRepository,
        ClientRepository clientRepository,
        InvoiceDocxRenderer docxRenderer,
        InvoicePdfRenderer pdfRenderer,
        GeneratedArtifactStore store,
        GeneratedArtifactRepository artifactRepository,
        GeneratedArtifactProperties props,
        CompanyProperties companyProperties
    ) {
        this.invoiceRepository = invoiceRepository;
        this.clientRepository = clientRepository;
        this.docxRenderer = docxRenderer;
        this.pdfRenderer = pdfRenderer;
        this.store = store;
        this.artifactRepository = artifactRepository;
        this.props = props;
        this.companyProperties = companyProperties;
    }

    /**
     * Renders the invoice as a PDF on-the-fly without persisting the result.
     *
     * @param invoiceId the invoice UUID
     * @return the rendered PDF bytes
     * @throws InvoiceNotFoundException if the invoice does not exist
     */
    @Transactional(readOnly = true)
    public byte[] previewPdf(UUID invoiceId) {
        Invoice invoice = invoiceRepository.findByIdWithLines(invoiceId)
            .orElseThrow(() -> new InvoiceNotFoundException(invoiceId));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));
        log.info("Preview PDF requested for invoice {}", invoiceId);
        return pdfRenderer.render(invoice, client, companyProperties);
    }

    /**
     * Generates and persists the artefact for the given invoice and format.
     *
     * @param invoiceId the invoice UUID
     * @param format    the desired format
     * @param overwrite if {@code false} and a row exists, throws
     *                  {@link ArtifactAlreadyExistsException}
     * @return the saved {@link GeneratedArtifact}
     * @throws ArtifactAlreadyExistsException if {@code overwrite=false} and row exists
     * @throws ArtifactTooLargeException      if rendered bytes exceed the configured limit
     */
    @Transactional
    public GeneratedArtifact generate(UUID invoiceId, ArtifactFormat format, boolean overwrite) {
        Invoice invoice = invoiceRepository.findByIdWithLines(invoiceId)
            .orElseThrow(() -> new InvoiceNotFoundException(invoiceId));
        Client client = clientRepository.findByIdAndDeletedAtIsNull(invoice.clientId())
            .orElseThrow(() -> new ClientNotFoundException(invoice.clientId()));

        Optional<GeneratedArtifact> existing = artifactRepository.find(invoiceId, format);
        if (existing.isPresent() && !overwrite) {
            throw new ArtifactAlreadyExistsException(invoiceId, format);
        }

        // Soft-delete old row when overwriting so the partial unique index is satisfied
        if (existing.isPresent()) {
            artifactRepository.softDeleteByInvoice(invoiceId);
        }

        byte[] bytes = renderBytes(invoice, client, format);

        if (bytes.length > props.maxBytesPerArtifact()) {
            throw new ArtifactTooLargeException(bytes.length, props.maxBytesPerArtifact());
        }

        try {
            String relativePath = store.write(invoiceId, format, bytes);
            String sha256 = computeSha256(bytes);
            Instant now = Instant.now();
            GeneratedArtifact artifact = new GeneratedArtifact(
                UUID.randomUUID(), invoiceId, format, relativePath,
                bytes.length, sha256, now, null
            );
            GeneratedArtifact saved = artifactRepository.upsert(artifact);
            log.info("Artefact generated for invoice {} format {}", invoiceId, format);
            return saved;
        } catch (IOException e) {
            throw new UncheckedIOException("Failed to write artefact for invoice " + invoiceId, e);
        }
    }

    /**
     * Streams the persisted bytes for the given invoice and format.
     *
     * @param invoiceId the invoice UUID
     * @param format    the desired format
     * @return the persisted bytes
     * @throws GeneratedArtifactNotFoundException if no artefact has been generated
     */
    @Transactional(readOnly = true)
    public byte[] streamGenerated(UUID invoiceId, ArtifactFormat format) {
        // Verify the invoice exists first so we return 404/invoice vs 404/artifact
        if (!invoiceRepository.findByIdWithLines(invoiceId).isPresent()) {
            throw new InvoiceNotFoundException(invoiceId);
        }
        GeneratedArtifact artifact = artifactRepository.find(invoiceId, format)
            .orElseThrow(() -> new GeneratedArtifactNotFoundException(invoiceId, format));
        try {
            return store.read(artifact.relativePath());
        } catch (IOException e) {
            throw new UncheckedIOException(
                "Failed to read artefact for invoice " + invoiceId, e);
        }
    }

    /**
     * Returns metadata for all generated formats for the given invoice.
     *
     * @param invoiceId the invoice UUID
     * @return metadata DTO with pdf and docx fields (null when not generated)
     * @throws InvoiceNotFoundException if the invoice does not exist
     */
    @Transactional(readOnly = true)
    public InvoiceArtifactsMetadataResponse metadata(UUID invoiceId) {
        if (!invoiceRepository.findByIdWithLines(invoiceId).isPresent()) {
            throw new InvoiceNotFoundException(invoiceId);
        }
        List<GeneratedArtifact> artifacts = artifactRepository.findAllByInvoice(invoiceId);
        GeneratedArtifactResponse pdfResp = null;
        GeneratedArtifactResponse docxResp = null;
        for (GeneratedArtifact a : artifacts) {
            GeneratedArtifactResponse r = new GeneratedArtifactResponse(
                a.format().name(), a.generatedAt(), a.sizeBytes(), a.sha256());
            if (a.format() == ArtifactFormat.PDF) {
                pdfResp = r;
            } else if (a.format() == ArtifactFormat.DOCX) {
                docxResp = r;
            }
        }
        return new InvoiceArtifactsMetadataResponse(pdfResp, docxResp);
    }

    /**
     * Soft-deletes all artefact rows and removes the underlying files for the given invoice.
     * Called during invoice soft-delete. Errors during file deletion are logged but not
     * re-thrown so the invoice delete succeeds.
     *
     * @param invoiceId the invoice UUID
     */
    @Transactional
    public void deleteAll(UUID invoiceId) {
        List<GeneratedArtifact> artifacts = artifactRepository.findAllByInvoice(invoiceId);
        artifactRepository.softDeleteByInvoice(invoiceId);
        for (GeneratedArtifact a : artifacts) {
            try {
                store.delete(a.relativePath());
            } catch (IOException e) {
                log.warn("Could not delete artefact file {} for invoice {}: {}",
                    a.relativePath(), invoiceId, e.getMessage());
            }
        }
        log.info("Artefacts deleted for invoice {}", invoiceId);
    }

    /**
     * Returns the bytes of the saved PDF artefact for use in email, or empty if not present.
     *
     * @param invoiceId the invoice UUID
     * @return Optional containing PDF bytes if a saved artefact exists
     */
    @Transactional(readOnly = true)
    public Optional<byte[]> findPdfBytes(UUID invoiceId) {
        return artifactRepository.find(invoiceId, ArtifactFormat.PDF)
            .map(artifact -> {
                try {
                    return store.read(artifact.relativePath());
                } catch (IOException e) {
                    log.warn("Could not read saved PDF for invoice {}: {}", invoiceId,
                        e.getMessage());
                    return null;
                }
            });
    }

    private byte[] renderBytes(Invoice invoice, Client client, ArtifactFormat format) {
        if (format == ArtifactFormat.PDF) {
            return pdfRenderer.render(invoice, client, companyProperties);
        }
        return docxRenderer.render(invoice, client, companyProperties);
    }

    private String computeSha256(byte[] bytes) {
        try {
            java.security.MessageDigest digest = java.security.MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(bytes);
            StringBuilder hex = new StringBuilder(64);
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}
