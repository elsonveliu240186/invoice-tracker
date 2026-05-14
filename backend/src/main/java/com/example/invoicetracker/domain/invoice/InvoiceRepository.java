package com.example.invoicetracker.domain.invoice;

import java.time.Instant;
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
     * Checks whether a number is already taken by an active invoice.
     *
     * @param number the invoice number (case-insensitive)
     * @return true if taken
     */
    boolean existsByNumberIgnoreCaseAndDeletedAtIsNull(String number);
}
