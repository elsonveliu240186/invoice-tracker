package com.example.invoicetracker.domain.invoice;

import java.util.UUID;

/**
 * Thrown when an invoice's client has no email address to send to.
 * Maps to HTTP 422 Unprocessable Entity.
 */
public class InvoiceHasNoRecipientException extends RuntimeException {

    public InvoiceHasNoRecipientException(UUID invoiceId) {
        super("Invoice client has no email address: " + invoiceId);
    }
}
