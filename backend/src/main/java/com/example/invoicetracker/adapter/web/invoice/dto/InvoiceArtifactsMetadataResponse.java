package com.example.invoicetracker.adapter.web.invoice.dto;

/**
 * Response DTO listing generated artefact metadata for both PDF and DOCX formats.
 *
 * @param pdf  the PDF artefact metadata, or {@code null} if not yet generated
 * @param docx the DOCX artefact metadata, or {@code null} if not yet generated
 */
public record InvoiceArtifactsMetadataResponse(
    GeneratedArtifactResponse pdf,
    GeneratedArtifactResponse docx
) {}
