package com.example.invoicetracker.adapter.web.invoice.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO representing a line item within an invoice response.
 */
public record InvoiceLineDto(
    UUID id,
    String description,
    int quantity,
    BigDecimal unitPrice,
    BigDecimal lineTotal
) {}
