package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;

/**
 * Port for rendering an invoice to a merged DOCX byte array using the active template.
 */
public interface InvoiceDocxRenderer {

    /**
     * Renders the given invoice into a DOCX byte array by merging it with the active template.
     *
     * @param invoice the invoice aggregate (with lines)
     * @param client  the client associated with the invoice
     * @param company the company configuration properties
     * @return the merged DOCX file as a byte array
     */
    byte[] render(Invoice invoice, Client client, CompanyProperties company);
}
