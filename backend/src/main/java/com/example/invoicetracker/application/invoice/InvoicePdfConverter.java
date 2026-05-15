package com.example.invoicetracker.application.invoice;

/**
 * Port for converting a DOCX byte array to a PDF byte array.
 */
public interface InvoicePdfConverter {

    /**
     * Converts the supplied DOCX bytes to PDF.
     *
     * @param docxBytes the DOCX file content
     * @return the resulting PDF content
     * @throws com.example.invoicetracker.domain.invoice.PdfConversionFailedException
     *         if conversion fails, times out, or the converter pool is saturated
     */
    byte[] convert(byte[] docxBytes);
}
