package com.example.invoicetracker.adapter.web.dashboard.dto;

import com.example.invoicetracker.domain.expense.MonthlyExpense;
import java.math.BigDecimal;
import java.util.List;

/**
 * Response payload for the /api/v1/dashboard/expense-stats endpoint.
 */
public record ExpenseStatsResponse(
    String from,
    String to,
    BigDecimal grandTotal,
    List<MonthlyExpense> expenseByMonth,
    List<CategoryExpense> expenseByCategory
) {}
