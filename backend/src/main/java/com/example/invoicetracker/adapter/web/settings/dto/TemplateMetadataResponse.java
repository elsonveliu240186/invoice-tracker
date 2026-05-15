package com.example.invoicetracker.adapter.web.settings.dto;

import java.time.Instant;

/**
 * Response DTO for GET /api/v1/settings/invoice-template/preview.
 *
 * @param filename   the active template filename
 * @param size       file size in bytes
 * @param uploadedAt last-modified time (approximate upload time)
 * @param isDefault  true when the bundled classpath default is being served
 */
public record TemplateMetadataResponse(
    String filename,
    long size,
    Instant uploadedAt,
    boolean isDefault
) {}
