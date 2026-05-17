package com.example.invoicetracker.domain.expense;

import java.util.UUID;

/**
 * Thrown when an expense cannot be found by the given ID, or is soft-deleted.
 */
public class ExpenseNotFoundException extends RuntimeException {

    public ExpenseNotFoundException(UUID id) {
        super("Expense not found: " + id);
    }
}
