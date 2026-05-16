package com.example.invoicetracker.domain.expense;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

/**
 * Domain record representing an expense in the invoice-tracker system.
 */
public record Expense(
    UUID id,
    BigDecimal amount,
    ExpenseCategory category,
    String description,
    LocalDate expenseDate,
    Instant createdAt,
    Instant updatedAt,
    Instant deletedAt
) {}
