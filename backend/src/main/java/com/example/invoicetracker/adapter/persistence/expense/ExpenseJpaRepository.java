package com.example.invoicetracker.adapter.persistence.expense;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for {@link ExpenseEntity}.
 */
public interface ExpenseJpaRepository extends JpaRepository<ExpenseEntity, UUID> {

    Optional<ExpenseEntity> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByIdAndDeletedAtIsNull(UUID id);

    @Query(
        "SELECT e FROM ExpenseEntity e "
        + "WHERE e.deletedAt IS NULL"
    )
    Page<ExpenseEntity> findAllActive(Pageable pageable);

    @Query(
        "SELECT e FROM ExpenseEntity e "
        + "WHERE e.deletedAt IS NULL "
        + "AND e.category = :category"
    )
    Page<ExpenseEntity> findAllActiveByCategory(
        @Param("category") String category,
        Pageable pageable
    );

    @Query(
        "SELECT e FROM ExpenseEntity e "
        + "WHERE e.deletedAt IS NULL "
        + "AND e.expenseDate >= :dateFrom "
        + "AND e.expenseDate <= :dateTo"
    )
    Page<ExpenseEntity> findAllActiveByDateRange(
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        Pageable pageable
    );

    @Query(
        "SELECT e FROM ExpenseEntity e "
        + "WHERE e.deletedAt IS NULL "
        + "AND e.category = :category "
        + "AND e.expenseDate >= :dateFrom "
        + "AND e.expenseDate <= :dateTo"
    )
    Page<ExpenseEntity> findAllActiveByCategoryAndDateRange(
        @Param("category") String category,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        Pageable pageable
    );

    @Query(
        "SELECT e.category AS category, SUM(e.amount) AS total, COUNT(e) AS count "
        + "FROM ExpenseEntity e "
        + "WHERE e.deletedAt IS NULL "
        + "AND e.expenseDate >= :fromDate "
        + "AND e.expenseDate <= :toDate "
        + "GROUP BY e.category"
    )
    List<CategorySummaryRow> findMonthlySummary(
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate
    );

    /**
     * Returns [month (String YYYY-MM), total (BigDecimal)] pairs for active expenses
     * within the given date range, ordered by month ascending.
     */
    @Query(
        value = "SELECT TO_CHAR(expense_date, 'YYYY-MM') AS month, "
            + "SUM(amount) AS total "
            + "FROM expenses "
            + "WHERE deleted_at IS NULL "
            + "  AND expense_date >= :fromDate "
            + "  AND expense_date <= :toDate "
            + "GROUP BY TO_CHAR(expense_date, 'YYYY-MM') "
            + "ORDER BY month ASC",
        nativeQuery = true
    )
    List<Object[]> findExpenseByMonth(
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate
    );

    /**
     * Returns [category (String), total (BigDecimal), count (Long)] triples for active
     * expenses within the given date range, ordered by total desc then category asc.
     */
    @Query(
        value = "SELECT category, SUM(amount) AS total, COUNT(*) AS cnt "
            + "FROM expenses "
            + "WHERE deleted_at IS NULL "
            + "  AND expense_date >= :fromDate "
            + "  AND expense_date <= :toDate "
            + "GROUP BY category "
            + "ORDER BY total DESC, category ASC",
        nativeQuery = true
    )
    List<Object[]> findExpenseByCategoryInRange(
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate
    );

    /**
     * Projection interface for JPQL aggregate query results.
     */
    interface CategorySummaryRow {
        String getCategory();
        java.math.BigDecimal getTotal();
        long getCount();
    }
}
