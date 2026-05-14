package com.example.invoicetracker.domain.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Domain record representing an invoice aggregate.
 * {@code clientEmail} is populated by the service layer when available (may be null if not joined).
 */
public record Invoice(
    UUID id,
    String number,
    UUID clientId,
    LocalDate issueDate,
    LocalDate dueDate,
    List<InvoiceLine> lines,
    BigDecimal taxRate,
    Instant lastSentAt,
    Instant createdAt,
    Instant updatedAt,
    Instant deletedAt,
    String clientEmail
) {

    /**
     * Computes the subtotal (sum of all line totals), rounded to 2dp HALF_EVEN.
     *
     * @return the subtotal
     */
    public BigDecimal subtotal() {
        return lines.stream()
            .map(InvoiceLine::lineTotal)
            .reduce(BigDecimal.ZERO, BigDecimal::add)
            .setScale(2, RoundingMode.HALF_EVEN);
    }

    /**
     * Computes the total (subtotal * (1 + taxRate)), rounded to 2dp HALF_EVEN.
     *
     * @return the total
     */
    public BigDecimal total() {
        BigDecimal sub = subtotal();
        return sub.multiply(BigDecimal.ONE.add(taxRate))
            .setScale(2, RoundingMode.HALF_EVEN);
    }
}
