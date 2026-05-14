package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;

/**
 * Port for rendering an invoice as a PDF byte array.
 */
public interface InvoicePdfRenderer {

    /**
     * Renders the invoice to a PDF byte array.
     *
     * @param invoice the invoice to render
     * @param client  the client associated with the invoice
     * @param company the company configuration
     * @return the PDF as a byte array
     */
    byte[] render(Invoice invoice, Client client, CompanyProperties company);
}
