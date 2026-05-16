package com.example.invoicetracker.domain.expense;

import java.math.BigDecimal;

/**
 * Domain record for aggregated expense totals per category.
 */
public record CategorySummary(
    ExpenseCategory category,
    BigDecimal total,
    long count
) {}
