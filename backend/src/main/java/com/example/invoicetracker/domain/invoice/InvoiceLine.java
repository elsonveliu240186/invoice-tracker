package com.example.invoicetracker.domain.invoice;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.UUID;

/**
 * Domain record representing a single line item on an invoice.
 */
public record InvoiceLine(
    UUID id,
    String description,
    int quantity,
    BigDecimal unitPrice,
    int position
) {

    /**
     * Computes the line total as quantity * unitPrice, rounded to 2dp HALF_EVEN.
     *
     * @return the line total
     */
    public BigDecimal lineTotal() {
        return BigDecimal.valueOf(quantity)
            .multiply(unitPrice)
            .setScale(2, RoundingMode.HALF_EVEN);
    }
}
