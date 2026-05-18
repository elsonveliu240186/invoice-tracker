package com.example.invoicetracker.adapter.web.dashboard.dto;

import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.math.BigDecimal;

/**
 * Controller-layer DTO for a per-category expense total in the dashboard.
 */
public record CategoryExpense(
    ExpenseCategory category,
    BigDecimal total,
    long count
) {}
