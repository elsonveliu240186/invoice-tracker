package com.example.invoicetracker.adapter.web.expense.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Response DTO for monthly expense summary.
 */
public record ExpenseSummaryResponse(
    String month,
    BigDecimal grandTotal,
    long totalCount,
    List<CategorySummaryResponse> byCategory
) {}
