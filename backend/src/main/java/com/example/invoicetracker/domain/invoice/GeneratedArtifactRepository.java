package com.example.invoicetracker.domain.invoice;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Port for persisting and querying generated invoice artefacts.
 */
public interface GeneratedArtifactRepository {

    /**
     * Finds an active (non-deleted) artefact for the given invoice and format.
     *
     * @param invoiceId the invoice UUID
     * @param format    the artefact format
     * @return an Optional containing the artefact, or empty if not found
     */
    Optional<GeneratedArtifact> find(UUID invoiceId, ArtifactFormat format);

    /**
     * Finds all active artefacts for the given invoice.
     *
     * @param invoiceId the invoice UUID
     * @return list of active artefacts (may be empty)
     */
    List<GeneratedArtifact> findAllByInvoice(UUID invoiceId);

    /**
     * Upserts (inserts or replaces) an artefact record for the given invoice and format.
     * If a soft-deleted row exists for the same (invoiceId, format) pair, a new row is inserted.
     *
     * @param artifact the artefact to persist
     * @return the saved artefact
     */
    GeneratedArtifact upsert(GeneratedArtifact artifact);

    /**
     * Soft-deletes all active artefacts for the given invoice.
     *
     * @param invoiceId the invoice UUID
     */
    void softDeleteByInvoice(UUID invoiceId);
}
