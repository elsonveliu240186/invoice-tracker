package com.example.invoicetracker.adapter.web.invoice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Response body representing an invoice.
 */
public record InvoiceResponse(
    UUID id,
    String number,
    UUID clientId,
    String clientEmail,
    LocalDate issueDate,
    LocalDate dueDate,
    List<InvoiceLineDto> lines,
    BigDecimal taxRate,
    BigDecimal subtotal,
    BigDecimal total,
    String status,
    Instant lastSentAt,
    Instant createdAt,
    Instant updatedAt
) {}
