package com.example.invoicetracker.application.template;

import java.io.IOException;
import java.io.InputStream;

/**
 * Port for managing the active invoice DOCX template.
 */
public interface InvoiceTemplateStore {

    /**
     * Opens an InputStream to the active template (filesystem or classpath fallback).
     *
     * @return an open InputStream; caller must close it
     * @throws IOException if the template cannot be opened
     */
    InputStream openTemplate() throws IOException;

    /**
     * Returns metadata about the active template.
     *
     * @return template metadata
     */
    TemplateMetadata getMetadata();

    /**
     * Atomically replaces the stored template with the supplied bytes.
     *
     * @param src       the new template content
     * @param sizeBytes total byte count (for validation before reading)
     * @return metadata of the newly stored template
     * @throws IOException if the write fails
     */
    TemplateMetadata replace(InputStream src, long sizeBytes) throws IOException;
}
