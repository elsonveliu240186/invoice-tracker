package com.example.invoicetracker.application.expense;

import com.example.invoicetracker.domain.expense.CategorySummary;
import java.math.BigDecimal;
import java.time.YearMonth;
import java.util.List;

/**
 * Application-layer record holding the monthly expense summary.
 */
public record MonthlySummary(
    YearMonth month,
    BigDecimal grandTotal,
    long totalCount,
    List<CategorySummary> byCategory
) {}
