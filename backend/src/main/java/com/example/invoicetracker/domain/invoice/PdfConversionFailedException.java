package com.example.invoicetracker.domain.invoice;

/**
 * Thrown when LibreOffice fails or times out during DOCX-to-PDF conversion.
 * Maps to HTTP 502 Bad Gateway with code {@code PDF_CONVERSION_FAILED}.
 *
 * <p>The {@code busy} flag is set to {@code true} when the semaphore is saturated
 * (too many concurrent conversions), in which case the client should retry later.
 */
public class PdfConversionFailedException extends RuntimeException {

    private final boolean busy;

    /**
     * Constructs the exception with a reason message.
     *
     * @param reason human-readable description
     * @param cause  the underlying cause, or {@code null}
     */
    public PdfConversionFailedException(String reason, Throwable cause) {
        super(reason, cause);
        this.busy = false;
    }

    /**
     * Constructs the exception with a reason message and no cause.
     *
     * @param reason human-readable description
     */
    public PdfConversionFailedException(String reason) {
        super(reason);
        this.busy = false;
    }

    /**
     * Constructs the exception indicating semaphore saturation.
     *
     * @param reason human-readable description
     * @param busy   {@code true} when the converter pool is fully occupied
     */
    public PdfConversionFailedException(String reason, boolean busy) {
        super(reason);
        this.busy = busy;
    }

    /**
     * Returns {@code true} if the converter semaphore was saturated.
     *
     * @return busy flag
     */
    public boolean isBusy() {
        return busy;
    }
}
