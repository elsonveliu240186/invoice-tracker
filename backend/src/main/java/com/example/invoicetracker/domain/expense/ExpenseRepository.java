package com.example.invoicetracker.domain.expense;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Domain port for expense persistence operations.
 */
public interface ExpenseRepository {

    Expense save(Expense expense);

    Optional<Expense> findByIdAndDeletedAtIsNull(UUID id);

    Page<Expense> findAllByDeletedAtIsNull(
        ExpenseCategory category,
        LocalDate dateFrom,
        LocalDate dateTo,
        Pageable pageable
    );

    List<CategorySummary> summaryForMonth(YearMonth month);

    boolean existsByIdAndDeletedAtIsNull(UUID id);

    /**
     * Returns expense totals grouped by calendar month (YYYY-MM) within the given date range.
     *
     * @param from start date (inclusive)
     * @param to   end date (inclusive)
     * @return list of monthly expense totals (caller zero-fills missing months)
     */
    List<MonthlyExpense> expenseByMonth(LocalDate from, LocalDate to);

    /**
     * Returns expense totals grouped by category within the given date range.
     *
     * @param from start date (inclusive)
     * @param to   end date (inclusive)
     * @return list of category summaries sorted by total desc, category asc
     */
    List<CategorySummary> expenseByCategoryInRange(LocalDate from, LocalDate to);
}
