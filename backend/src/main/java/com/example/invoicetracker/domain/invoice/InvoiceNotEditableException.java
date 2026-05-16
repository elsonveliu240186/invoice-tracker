package com.example.invoicetracker.domain.invoice;

import java.util.UUID;

/**
 * Thrown when an attempt is made to update an invoice that is not in DRAFT status.
 */
public class InvoiceNotEditableException extends RuntimeException {

    /**
     * Constructs the exception with the invoice id and current status.
     *
     * @param id     the invoice UUID
     * @param status the current status
     */
    public InvoiceNotEditableException(UUID id, InvoiceStatus status) {
        super("Invoice " + id + " cannot be edited because its status is " + status);
    }
}
