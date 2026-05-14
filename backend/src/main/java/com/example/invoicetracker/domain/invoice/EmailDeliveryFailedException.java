package com.example.invoicetracker.domain.invoice;

/**
 * Thrown when the SMTP delivery of an invoice email fails.
 * Maps to HTTP 502 Bad Gateway.
 */
public class EmailDeliveryFailedException extends RuntimeException {

    public EmailDeliveryFailedException(String invoiceId, Throwable cause) {
        super("Failed to deliver email for invoice: " + invoiceId, cause);
    }
}
