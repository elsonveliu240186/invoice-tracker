package com.example.invoicetracker.adapter.persistence.expense;

import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import org.springframework.stereotype.Component;

/**
 * Plain mapper between {@link ExpenseEntity} and {@link Expense} domain record.
 */
@Component
public class ExpenseEntityMapper {

    /**
     * Maps a JPA entity to the domain record.
     *
     * @param entity the JPA entity
     * @return the domain record
     */
    public Expense toDomain(ExpenseEntity entity) {
        return new Expense(
            entity.getId(),
            entity.getAmount(),
            ExpenseCategory.valueOf(entity.getCategory()),
            entity.getDescription(),
            entity.getExpenseDate(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getDeletedAt()
        );
    }

    /**
     * Maps a domain record to a JPA entity.
     *
     * @param expense the domain record
     * @return the JPA entity
     */
    public ExpenseEntity toEntity(Expense expense) {
        ExpenseEntity entity = new ExpenseEntity();
        entity.setId(expense.id());
        entity.setAmount(expense.amount());
        entity.setCategory(expense.category().name());
        entity.setDescription(expense.description());
        entity.setExpenseDate(expense.expenseDate());
        entity.setCreatedAt(expense.createdAt());
        entity.setUpdatedAt(expense.updatedAt());
        entity.setDeletedAt(expense.deletedAt());
        return entity;
    }

    /**
     * Updates a managed JPA entity's mutable fields from the domain record.
     * Used when the entity is already in the JPA session to avoid detached-entity conflicts.
     *
     * @param entity  the managed JPA entity to update
     * @param expense the domain record with new values
     */
    public void updateEntity(ExpenseEntity entity, Expense expense) {
        entity.setAmount(expense.amount());
        entity.setCategory(expense.category().name());
        entity.setDescription(expense.description());
        entity.setExpenseDate(expense.expenseDate());
        entity.setDeletedAt(expense.deletedAt());
    }
}
