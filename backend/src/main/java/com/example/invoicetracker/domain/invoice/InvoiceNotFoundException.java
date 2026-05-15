package com.example.invoicetracker.domain.invoice;

import java.util.UUID;

/**
 * Thrown when an invoice cannot be found by the given ID, or is soft-deleted.
 */
public class InvoiceNotFoundException extends RuntimeException {

    public InvoiceNotFoundException(UUID id) {
        super("Invoice not found: " + id);
    }
}
