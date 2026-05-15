package com.example.invoicetracker.domain.invoice;

import java.util.UUID;

/**
 * Thrown when an artefact already exists for the given invoice and format and
 * {@code overwrite=false} was specified.
 */
public class ArtifactAlreadyExistsException extends RuntimeException {

    /**
     * Constructs the exception for a specific invoice and format combination.
     *
     * @param invoiceId the invoice UUID
     * @param format    the conflicting format
     */
    public ArtifactAlreadyExistsException(UUID invoiceId, ArtifactFormat format) {
        super("Artefact already exists for invoice " + invoiceId + " format " + format);
    }
}
