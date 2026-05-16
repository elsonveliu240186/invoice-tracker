package com.example.invoicetracker.adapter.web.expense.dto;

import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.math.BigDecimal;

/**
 * Response DTO for per-category expense summary.
 */
public record CategorySummaryResponse(
    ExpenseCategory category,
    BigDecimal total,
    long count
) {}
