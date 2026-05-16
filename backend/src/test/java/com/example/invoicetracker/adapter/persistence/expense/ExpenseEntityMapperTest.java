package com.example.invoicetracker.adapter.persistence.expense;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class ExpenseEntityMapperTest {

    private final ExpenseEntityMapper mapper = new ExpenseEntityMapper();

    @Test
    void round_trip_preserves_all_fields() {
        UUID id = UUID.randomUUID();
        Instant now = Instant.parse("2026-05-16T10:00:00Z");
        Expense original = new Expense(
            id,
            new BigDecimal("123.45"),
            ExpenseCategory.HOUSING,
            "Monthly rent",
            LocalDate.of(2026, 5, 1),
            now,
            now,
            null
        );

        ExpenseEntity entity = mapper.toEntity(original);
        Expense restored = mapper.toDomain(entity);

        assertThat(restored.id()).isEqualTo(original.id());
        assertThat(restored.amount()).isEqualByComparingTo(original.amount());
        assertThat(restored.category()).isEqualTo(original.category());
        assertThat(restored.description()).isEqualTo(original.description());
        assertThat(restored.expenseDate()).isEqualTo(original.expenseDate());
        assertThat(restored.createdAt()).isEqualTo(original.createdAt());
        assertThat(restored.updatedAt()).isEqualTo(original.updatedAt());
        assertThat(restored.deletedAt()).isNull();
    }

    @Test
    void to_entity_stores_category_as_string_name() {
        Instant now = Instant.now();
        Expense expense = new Expense(UUID.randomUUID(), BigDecimal.TEN,
            ExpenseCategory.TRAVEL, null, LocalDate.now(), now, now, null);

        ExpenseEntity entity = mapper.toEntity(expense);

        assertThat(entity.getCategory()).isEqualTo("TRAVEL");
    }

    @Test
    void update_entity_copies_mutable_fields() {
        Instant now = Instant.now();
        ExpenseEntity entity = new ExpenseEntity();
        entity.setId(UUID.randomUUID());
        entity.setAmount(BigDecimal.TEN);
        entity.setCategory("FOOD_DRINK");
        entity.setExpenseDate(LocalDate.now());
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);

        Expense updated = new Expense(
            entity.getId(),
            new BigDecimal("99.99"),
            ExpenseCategory.UTILITIES,
            "Electric bill",
            LocalDate.of(2026, 4, 10),
            now,
            now,
            now
        );

        mapper.updateEntity(entity, updated);

        assertThat(entity.getAmount()).isEqualByComparingTo("99.99");
        assertThat(entity.getCategory()).isEqualTo("UTILITIES");
        assertThat(entity.getDescription()).isEqualTo("Electric bill");
        assertThat(entity.getExpenseDate()).isEqualTo(LocalDate.of(2026, 4, 10));
        assertThat(entity.getDeletedAt()).isEqualTo(now);
    }
}
