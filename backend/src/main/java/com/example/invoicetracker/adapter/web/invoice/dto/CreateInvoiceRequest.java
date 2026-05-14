package com.example.invoicetracker.adapter.web.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request body for creating a new invoice.
 */
public record CreateInvoiceRequest(
    @NotBlank String number,
    @NotNull UUID clientId,
    @NotNull LocalDate issueDate,
    @NotNull LocalDate dueDate,
    @NotEmpty @Valid List<CreateInvoiceLineRequest> lines,
    @NotNull @DecimalMin("0") BigDecimal taxRate
) {}
