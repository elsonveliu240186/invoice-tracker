package com.example.invoicetracker.application.template;

/**
 * Thrown when an uploaded template exceeds {@code app.invoice.max-template-bytes}.
 * Maps to HTTP 413 Content Too Large.
 */
public class TemplateTooLargeException extends RuntimeException {

    /**
     * Constructs the exception with size details.
     *
     * @param sizeBytes  the size of the upload attempt
     * @param limitBytes the configured limit
     */
    public TemplateTooLargeException(long sizeBytes, long limitBytes) {
        super("Template too large: " + sizeBytes + " bytes, limit is " + limitBytes + " bytes");
    }
}
