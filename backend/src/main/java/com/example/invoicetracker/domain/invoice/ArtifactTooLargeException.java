package com.example.invoicetracker.domain.invoice;

/**
 * Thrown when rendered artefact bytes exceed the configured
 * {@code app.invoice.generated.max-bytes-per-artifact} limit.
 */
public class ArtifactTooLargeException extends RuntimeException {

    /**
     * Constructs the exception with the actual and maximum sizes.
     *
     * @param actualBytes the size of the rendered bytes
     * @param maxBytes    the configured maximum
     */
    public ArtifactTooLargeException(long actualBytes, long maxBytes) {
        super("Artefact size " + actualBytes + " bytes exceeds limit of " + maxBytes + " bytes");
    }
}
