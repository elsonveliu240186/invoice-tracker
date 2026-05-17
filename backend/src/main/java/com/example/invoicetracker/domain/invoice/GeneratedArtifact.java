package com.example.invoicetracker.domain.invoice;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain record representing a persisted generated invoice artefact.
 *
 * @param id           the artefact UUID
 * @param invoiceId    the owning invoice UUID
 * @param format       the artefact format (PDF or DOCX)
 * @param relativePath the filesystem path relative to the configured base directory
 * @param sizeBytes    the artefact size in bytes
 * @param sha256       the hex-encoded SHA-256 digest of the stored bytes
 * @param generatedAt  the timestamp when this artefact was generated
 * @param deletedAt    soft-delete timestamp; null if the artefact is active
 */
public record GeneratedArtifact(
    UUID id,
    UUID invoiceId,
    ArtifactFormat format,
    String relativePath,
    long sizeBytes,
    String sha256,
    Instant generatedAt,
    Instant deletedAt
) {}
