package com.example.invoicetracker.domain.invoice;

/**
 * Thrown when an invoice number is already in use by an active invoice.
 */
public class InvoiceNumberTakenException extends RuntimeException {

    public InvoiceNumberTakenException(String number) {
        super("Invoice number already in use: " + number);
    }
}
