package com.example.invoicetracker.adapter.web.invoice.dto;

import java.time.Instant;

/**
 * Response DTO for a single generated artefact.
 *
 * @param format      the artefact format name (PDF or DOCX)
 * @param generatedAt the timestamp when the artefact was generated
 * @param sizeBytes   the artefact size in bytes
 * @param sha256      the hex-encoded SHA-256 digest
 */
public record GeneratedArtifactResponse(
    String format,
    Instant generatedAt,
    long sizeBytes,
    String sha256
) {}
