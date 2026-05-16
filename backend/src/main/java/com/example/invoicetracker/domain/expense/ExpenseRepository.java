package com.example.invoicetracker.domain.expense;

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
        java.time.LocalDate dateFrom,
        java.time.LocalDate dateTo,
        Pageable pageable
    );

    List<CategorySummary> summaryForMonth(YearMonth month);

    boolean existsByIdAndDeletedAtIsNull(UUID id);
}
