package com.example.invoicetracker.domain.invoice;

import java.util.UUID;

/**
 * Thrown when a requested generated artefact has not yet been produced for the given
 * invoice and format.
 */
public class GeneratedArtifactNotFoundException extends RuntimeException {

    /**
     * Constructs the exception for a specific invoice and format combination.
     *
     * @param invoiceId the invoice UUID
     * @param format    the requested format
     */
    public GeneratedArtifactNotFoundException(UUID invoiceId, ArtifactFormat format) {
        super("No generated artefact found for invoice " + invoiceId + " format " + format);
    }
}
