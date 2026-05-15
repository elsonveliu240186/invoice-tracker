package com.example.invoicetracker.adapter.web.settings.dto;

import java.time.Instant;

/**
 * Response DTO for POST /api/v1/settings/invoice-template.
 *
 * @param filename   the stored filename (always "invoice-template.docx")
 * @param size       file size in bytes
 * @param uploadedAt the approximate upload timestamp
 */
public record UploadTemplateResponse(
    String filename,
    long size,
    Instant uploadedAt
) {}
