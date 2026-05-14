package com.example.invoicetracker.application.template;

import java.time.Instant;

/**
 * Immutable metadata describing the active invoice template.
 *
 * @param filename   the stored filename (always "invoice-template.docx")
 * @param sizeBytes  file size in bytes
 * @param uploadedAt last-modified time used as approximate upload timestamp
 * @param isDefault  true when the classpath bundled default is being served
 */
public record TemplateMetadata(
    String filename,
    long sizeBytes,
    Instant uploadedAt,
    boolean isDefault
) {}
