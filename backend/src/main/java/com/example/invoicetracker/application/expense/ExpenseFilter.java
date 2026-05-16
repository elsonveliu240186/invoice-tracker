package com.example.invoicetracker.application.expense;

import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.time.LocalDate;

/**
 * Filter parameters for listing expenses.
 */
public record ExpenseFilter(
    ExpenseCategory category,
    LocalDate dateFrom,
    LocalDate dateTo
) {}
