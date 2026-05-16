package com.example.invoicetracker.adapter.web.expense.dto;

import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Response DTO for a single expense.
 */
public record ExpenseResponse(
    UUID id,
    BigDecimal amount,
    ExpenseCategory category,
    String description,
    LocalDate expenseDate,
    Instant createdAt,
    Instant updatedAt
) {}
