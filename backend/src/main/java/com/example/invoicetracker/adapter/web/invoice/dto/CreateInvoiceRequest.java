package com.example.invoicetracker.adapter.web.invoice.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Request body for creating a new invoice.
 * {@code number} is optional; when absent or blank the server generates the next sequential value.
 */
public record CreateInvoiceRequest(
    @Size(max = 64) String number,
    @NotNull UUID clientId,
    @NotNull LocalDate issueDate,
    @NotNull LocalDate dueDate,
    @NotEmpty @Valid List<CreateInvoiceLineRequest> lines,
    @NotNull @DecimalMin("0") BigDecimal taxRate
) {}
