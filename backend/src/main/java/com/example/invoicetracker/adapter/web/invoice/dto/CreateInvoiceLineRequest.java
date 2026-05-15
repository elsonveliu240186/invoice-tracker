package com.example.invoicetracker.adapter.web.invoice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/**
 * DTO for a single line item within a create-invoice request.
 */
public record CreateInvoiceLineRequest(
    @NotBlank String description,
    @Min(1) int quantity,
    @NotNull @DecimalMin("0") BigDecimal unitPrice
) {}
