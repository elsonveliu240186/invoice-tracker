package com.example.invoicetracker.domain.expense;

import java.math.BigDecimal;

/**
 * Domain record for aggregated expense total for a given calendar month.
 */
public record MonthlyExpense(
    String month,
    BigDecimal total
) {}
