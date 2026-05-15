package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.invoice.Invoice;

/**
 * Port for sending invoice emails with a PDF attachment.
 */
public interface InvoiceMailer {

    /**
     * Sends the invoice email to the given recipient address.
     *
     * @param invoice    the invoice
     * @param toEmail    the recipient's email address
     * @param pdfBytes   the rendered PDF bytes to attach
     * @param company    the company configuration
     * @param clientName the client's display name
     */
    void send(Invoice invoice, String toEmail, byte[] pdfBytes,
              CompanyProperties company, String clientName);
}
