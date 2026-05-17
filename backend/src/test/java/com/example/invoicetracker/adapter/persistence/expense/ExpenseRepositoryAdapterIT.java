package com.example.invoicetracker.adapter.persistence.expense;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.domain.expense.CategorySummary;
import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class ExpenseRepositoryAdapterIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    ExpenseRepositoryAdapter adapter;

    @Autowired
    ExpenseJpaRepository jpaRepository;

    private Expense buildExpense(BigDecimal amount, ExpenseCategory category,
        String description, LocalDate date) {
        Instant now = Instant.now();
        return new Expense(UUID.randomUUID(), amount, category, description, date, now, now, null);
    }

    @Test
    void persists_and_finds() {
        Expense expense = buildExpense(
            new BigDecimal("99.99"), ExpenseCategory.FOOD_DRINK,
            "Test expense", LocalDate.of(2026, 5, 1));

        Expense saved = adapter.save(expense);

        Optional<Expense> found = adapter.findByIdAndDeletedAtIsNull(saved.id());

        assertThat(found).isPresent();
        assertThat(found.get().amount()).isEqualByComparingTo("99.99");
        assertThat(found.get().category()).isEqualTo(ExpenseCategory.FOOD_DRINK);
        assertThat(found.get().description()).isEqualTo("Test expense");
        assertThat(found.get().deletedAt()).isNull();
    }

    @Test
    void excludes_soft_deleted() {
        Expense expense = buildExpense(
            new BigDecimal("50.00"), ExpenseCategory.TRANSPORT,
            "Bus ticket", LocalDate.of(2026, 5, 2));
        Expense saved = adapter.save(expense);

        Expense withDelete = new Expense(
            saved.id(), saved.amount(), saved.category(), saved.description(),
            saved.expenseDate(), saved.createdAt(), saved.updatedAt(), Instant.now());
        adapter.save(withDelete);

        Optional<Expense> byId = adapter.findByIdAndDeletedAtIsNull(saved.id());
        assertThat(byId).isEmpty();

        boolean exists = adapter.existsByIdAndDeletedAtIsNull(saved.id());
        assertThat(exists).isFalse();
    }

    @Test
    void filters_by_category_and_date_range() {
        // Use a narrow unique date window unlikely to clash with other test data
        LocalDate fromDate = LocalDate.of(2021, 1, 1);
        LocalDate midDate = LocalDate.of(2021, 1, 15);
        LocalDate toDate = LocalDate.of(2021, 1, 31);
        LocalDate outsideDate = LocalDate.of(2020, 12, 31);

        adapter.save(buildExpense(new BigDecimal("10.00"), ExpenseCategory.FOOD_DRINK, "a", fromDate));
        adapter.save(buildExpense(new BigDecimal("20.00"), ExpenseCategory.FOOD_DRINK, "b", midDate));
        adapter.save(buildExpense(new BigDecimal("30.00"), ExpenseCategory.TRANSPORT, "c", fromDate));
        adapter.save(buildExpense(new BigDecimal("40.00"), ExpenseCategory.FOOD_DRINK, "d", outsideDate));
        adapter.save(buildExpense(new BigDecimal("50.00"), ExpenseCategory.FOOD_DRINK, "e", toDate));

        Page<Expense> result = adapter.findAllByDeletedAtIsNull(
            ExpenseCategory.FOOD_DRINK, fromDate, toDate,
            PageRequest.of(0, 20, Sort.by("expenseDate")));

        // Should have exactly the 3 FOOD_DRINK expenses within date range
        List<BigDecimal> amounts = result.getContent().stream().map(Expense::amount).toList();
        assertThat(amounts).hasSize(3);
        assertThat(amounts.stream().map(BigDecimal::intValue).toList())
            .containsExactlyInAnyOrder(10, 20, 50);
    }

    @Test
    void summary_aggregates_correctly() {
        YearMonth month = YearMonth.of(2026, 3);
        LocalDate mar1 = LocalDate.of(2026, 3, 1);
        LocalDate mar2 = LocalDate.of(2026, 3, 2);

        adapter.save(buildExpense(new BigDecimal("100.00"), ExpenseCategory.HOUSING, "r1", mar1));
        adapter.save(buildExpense(new BigDecimal("200.00"), ExpenseCategory.HOUSING, "r2", mar2));
        adapter.save(buildExpense(new BigDecimal("50.00"), ExpenseCategory.HEALTH, "h1", mar1));

        // Add a soft-deleted one that should be excluded
        Expense toDelete = adapter.save(buildExpense(
            new BigDecimal("999.00"), ExpenseCategory.HOUSING, "deleted", mar1));
        Expense softDeleted = new Expense(toDelete.id(), toDelete.amount(), toDelete.category(),
            toDelete.description(), toDelete.expenseDate(), toDelete.createdAt(),
            toDelete.updatedAt(), Instant.now());
        adapter.save(softDeleted);

        List<CategorySummary> result = adapter.summaryForMonth(month);

        assertThat(result).hasSize(2);
        CategorySummary housing = result.stream()
            .filter(cs -> cs.category() == ExpenseCategory.HOUSING)
            .findFirst().orElseThrow();
        CategorySummary health = result.stream()
            .filter(cs -> cs.category() == ExpenseCategory.HEALTH)
            .findFirst().orElseThrow();

        assertThat(housing.total()).isEqualByComparingTo("300.00");
        assertThat(housing.count()).isEqualTo(2);
        assertThat(health.total()).isEqualByComparingTo("50.00");
        assertThat(health.count()).isEqualTo(1);
    }

    @Test
    void update_uses_managed_entity_no_non_unique_object_exception() {
        Expense original = buildExpense(
            new BigDecimal("25.00"), ExpenseCategory.SHOPPING, "Original", LocalDate.of(2026, 5, 5));
        Expense saved = adapter.save(original);

        // update immediately after saving (entity may be in session)
        Expense updated = new Expense(saved.id(), new BigDecimal("35.00"), ExpenseCategory.EDUCATION,
            "Updated", saved.expenseDate(), saved.createdAt(), saved.updatedAt(), null);

        Expense result = adapter.save(updated);

        assertThat(result.amount()).isEqualByComparingTo("35.00");
        assertThat(result.category()).isEqualTo(ExpenseCategory.EDUCATION);
        assertThat(result.description()).isEqualTo("Updated");
    }

    @Test
    void pagination_returns_correct_slice() {
        LocalDate date = LocalDate.of(2026, 2, 1);
        for (int i = 1; i <= 15; i++) {
            adapter.save(buildExpense(
                new BigDecimal(i + ".00"), ExpenseCategory.OTHER, "item " + i, date));
        }

        Page<Expense> page = adapter.findAllByDeletedAtIsNull(
            null, null, null, PageRequest.of(1, 5, Sort.by("amount")));

        assertThat(page.getContent()).hasSize(5);
        assertThat(page.getNumber()).isEqualTo(1);
        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(15);
    }
}
