package com.example.invoicetracker.adapter.persistence.invoice;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for {@link InvoiceEntity}.
 */
public interface InvoiceJpaRepository extends JpaRepository<InvoiceEntity, UUID> {

    @EntityGraph(attributePaths = "lines")
    @Query("SELECT i FROM InvoiceEntity i WHERE i.id = :id AND i.deletedAt IS NULL")
    Optional<InvoiceEntity> findByIdWithLinesAndNotDeleted(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE InvoiceEntity i SET i.lastSentAt = :ts WHERE i.id = :id")
    int updateLastSentAt(@Param("id") UUID id, @Param("ts") Instant ts);

    @Modifying
    @Query("UPDATE InvoiceEntity i SET i.status = 'PAID' WHERE i.id = :id AND i.deletedAt IS NULL")
    int markPaid(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE InvoiceEntity i SET i.status = 'SENT' "
        + "WHERE i.id = :id AND i.deletedAt IS NULL AND i.status = 'DRAFT'")
    int markSentIfDraft(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE InvoiceEntity i SET i.deletedAt = :ts WHERE i.id = :id AND i.deletedAt IS NULL")
    int softDelete(@Param("id") UUID id, @Param("ts") Instant ts);

    @EntityGraph(attributePaths = "lines")
    @Query(
        "SELECT i FROM InvoiceEntity i WHERE i.deletedAt IS NULL "
        + "AND (:clientId IS NULL OR i.clientId = :clientId)"
    )
    Page<InvoiceEntity> findAllActive(
        @Param("clientId") UUID clientId,
        Pageable pageable
    );

    boolean existsByNumberIgnoreCaseAndDeletedAtIsNull(String number);

    /**
     * Returns [status (String), count (Long)] pairs for active invoices.
     */
    @Query(
        value = "SELECT status, COUNT(*) AS cnt FROM invoices WHERE deleted_at IS NULL "
            + "GROUP BY status",
        nativeQuery = true
    )
    List<Object[]> countByStatus();

    /**
     * Returns [status (String), revenue (BigDecimal)] pairs: sum of (subtotal * (1+taxRate))
     * approximated per row for active invoices.
     * Since individual line sums are not trivially aggregatable in JPQL without a subquery,
     * we use a native SQL query for revenue aggregation.
     */
    @Query(
        value = "SELECT i.status, "
            + "SUM((SELECT SUM(il.quantity * il.unit_price) "
            + "     FROM invoice_lines il WHERE il.invoice_id = i.id) "
            + "    * (1 + i.tax_rate)) AS revenue "
            + "FROM invoices i "
            + "WHERE i.deleted_at IS NULL "
            + "GROUP BY i.status",
        nativeQuery = true
    )
    List<Object[]> revenueByStatus();

    /**
     * Returns [month (String YYYY-MM), revenue (BigDecimal)] pairs for active invoices
     * in the last {@code months} months, ordered by month ascending.
     */
    @Query(
        value = "SELECT TO_CHAR(i.issue_date, 'YYYY-MM') AS month, "
            + "SUM((SELECT SUM(il.quantity * il.unit_price) "
            + "     FROM invoice_lines il WHERE il.invoice_id = i.id) "
            + "    * (1 + i.tax_rate)) AS revenue "
            + "FROM invoices i "
            + "WHERE i.deleted_at IS NULL "
            + "  AND i.issue_date >= DATE_TRUNC('month', NOW()) - CAST(:months || ' months' AS INTERVAL) "
            + "GROUP BY TO_CHAR(i.issue_date, 'YYYY-MM') "
            + "ORDER BY month ASC",
        nativeQuery = true
    )
    List<Object[]> revenueByMonth(@Param("months") int months);

    /**
     * Returns [status (String), count (Long)] pairs for active invoices with issue_date in
     * [from, to].
     */
    @Query(
        value = "SELECT status, COUNT(*) FROM invoices WHERE deleted_at IS NULL "
            + "AND issue_date >= :from AND issue_date <= :to GROUP BY status",
        nativeQuery = true
    )
    List<Object[]> countByStatusInRange(@Param("from") LocalDate from, @Param("to") LocalDate to);

    /**
     * Returns [status (String), revenue (BigDecimal)] pairs for active invoices with issue_date in
     * [from, to].
     */
    @Query(
        value = "SELECT i.status, "
            + "SUM((SELECT SUM(il.quantity * il.unit_price) FROM invoice_lines il "
            + "     WHERE il.invoice_id = i.id) "
            + "    * (1 + i.tax_rate)) AS revenue "
            + "FROM invoices i WHERE i.deleted_at IS NULL "
            + "AND i.issue_date >= :from AND i.issue_date <= :to GROUP BY i.status",
        nativeQuery = true
    )
    List<Object[]> revenueByStatusInRange(@Param("from") LocalDate from,
        @Param("to") LocalDate to);

    /**
     * Returns [month (String YYYY-MM), revenue (BigDecimal)] pairs for active invoices with
     * issue_date in [from, to], ordered by month ascending.
     */
    @Query(
        value = "SELECT TO_CHAR(i.issue_date, 'YYYY-MM') AS month, "
            + "SUM((SELECT SUM(il.quantity * il.unit_price) FROM invoice_lines il "
            + "     WHERE il.invoice_id = i.id) "
            + "    * (1 + i.tax_rate)) AS revenue "
            + "FROM invoices i WHERE i.deleted_at IS NULL "
            + "AND i.issue_date >= :from AND i.issue_date <= :to "
            + "GROUP BY TO_CHAR(i.issue_date, 'YYYY-MM') ORDER BY month ASC",
        nativeQuery = true
    )
    List<Object[]> revenueByMonthInRange(@Param("from") LocalDate from,
        @Param("to") LocalDate to);

    /**
     * Returns the maximum invoice number for the given year prefix.
     * Numbers are expected in the format {@code INV-YYYY-NNNN}.
     *
     * @param yearPrefix e.g. "INV-2026-"
     * @return the max number string, or null if none exist
     */
    @Query("SELECT MAX(i.number) FROM InvoiceEntity i "
        + "WHERE i.deletedAt IS NULL AND i.number LIKE :yearPrefix")
    String findMaxNumberByYearPrefix(@Param("yearPrefix") String yearPrefix);

    /**
     * Acquires a Postgres advisory transaction lock to serialise concurrent invoice numbering.
     *
     * @param lockKey the lock key (hashtext of a constant string + year)
     */
    @Modifying
    @Query(value = "SELECT pg_advisory_xact_lock(:lockKey)", nativeQuery = true)
    void acquireAdvisoryLock(@Param("lockKey") long lockKey);
}
