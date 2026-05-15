package com.example.invoicetracker.domain.invoice;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Port (domain interface) for invoice persistence.
 */
public interface InvoiceRepository {

    /**
     * Finds an active invoice by ID, eagerly loading its lines.
     *
     * @param id the invoice UUID
     * @return the invoice, or empty if not found or soft-deleted
     */
    Optional<Invoice> findByIdWithLines(UUID id);

    /**
     * Persists (creates or updates) an invoice.
     *
     * @param invoice the invoice domain record
     * @return the saved invoice
     */
    Invoice save(Invoice invoice);

    /**
     * Updates the lastSentAt timestamp for an invoice.
     *
     * @param id the invoice UUID
     * @param ts the timestamp to set
     * @return the updated invoice
     */
    Invoice markSent(UUID id, Instant ts);

    /**
     * Returns a page of active invoices for a given client (or all clients if clientId is null).
     *
     * @param clientId optional client filter
     * @param pageable pagination parameters
     * @return a page of invoices
     */
    Page<Invoice> findAll(UUID clientId, Pageable pageable);

    /**
     * Marks an invoice as PAID.
     *
     * @param id the invoice UUID
     * @return the updated invoice
     * @throws InvoiceNotFoundException if not found or soft-deleted
     */
    Invoice markPaid(UUID id);

    /**
     * Sets the status to SENT only if the current status is DRAFT (no-op otherwise).
     *
     * @param id the invoice UUID
     */
    void markSentIfDraft(UUID id);

    /**
     * Returns counts grouped by status for active (non-deleted) invoices.
     *
     * @return list of [status, count] pairs
     */
    List<Object[]> countByStatus();

    /**
     * Returns the sum of totals for active invoices by status.
     *
     * <p>Each element is an Object[] with [status (String), revenue (BigDecimal)].
     *
     * @return list of [status, revenue] pairs
     */
    List<Object[]> revenueByStatus();

    /**
     * Returns the sum of totals for active invoices grouped by month (YYYY-MM) for the last
     * {@code months} months.
     *
     * <p>Each element is an Object[] with [month (String), revenue (BigDecimal)].
     *
     * @param months number of months to look back
     * @return list of [month, revenue] pairs ordered by month ascending
     */
    List<Object[]> revenueByMonth(int months);

    /**
     * Checks whether a number is already taken by an active invoice.
     *
     * @param number the invoice number (case-insensitive)
     * @return true if taken
     */
    boolean existsByNumberIgnoreCaseAndDeletedAtIsNull(String number);
}
