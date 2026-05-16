package com.example.invoicetracker.application.expense;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.domain.expense.CategorySummary;
import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import com.example.invoicetracker.domain.expense.ExpenseNotFoundException;
import com.example.invoicetracker.domain.expense.ExpenseRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock
    private ExpenseRepository expenseRepository;

    private Clock fixedClock;
    private ExpenseService expenseService;

    @BeforeEach
    void setUp() {
        fixedClock = Clock.fixed(Instant.parse("2026-05-16T10:00:00Z"), ZoneOffset.UTC);
        expenseService = new ExpenseService(expenseRepository, fixedClock);
    }

    private Expense makeExpense(UUID id) {
        Instant now = Instant.now(fixedClock);
        return new Expense(id, new BigDecimal("50.00"), ExpenseCategory.FOOD_DRINK,
            "Lunch", LocalDate.of(2026, 5, 16), now, now, null);
    }

    @Test
    void create_persists_and_returns_id() {
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        Expense result = expenseService.create(
            new BigDecimal("50.00"), ExpenseCategory.FOOD_DRINK, "Lunch",
            LocalDate.of(2026, 5, 16));

        assertThat(result.id()).isNotNull();
        assertThat(result.amount()).isEqualByComparingTo("50.00");
        assertThat(result.category()).isEqualTo(ExpenseCategory.FOOD_DRINK);
        assertThat(result.createdAt()).isEqualTo(Instant.parse("2026-05-16T10:00:00Z"));
        assertThat(result.deletedAt()).isNull();
        verify(expenseRepository).save(any(Expense.class));
    }

    @Test
    void update_throws_not_found_when_deleted() {
        UUID id = UUID.randomUUID();
        when(expenseRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.update(
            id, new BigDecimal("10.00"), ExpenseCategory.TRANSPORT, null,
            LocalDate.of(2026, 5, 1)))
            .isInstanceOf(ExpenseNotFoundException.class);
    }

    @Test
    void update_returns_updated_expense() {
        UUID id = UUID.randomUUID();
        Expense existing = makeExpense(id);
        when(expenseRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(existing));
        when(expenseRepository.save(any(Expense.class))).thenAnswer(inv -> inv.getArgument(0));

        Expense result = expenseService.update(
            id, new BigDecimal("75.00"), ExpenseCategory.TRANSPORT, "Bus",
            LocalDate.of(2026, 5, 10));

        assertThat(result.amount()).isEqualByComparingTo("75.00");
        assertThat(result.category()).isEqualTo(ExpenseCategory.TRANSPORT);
        assertThat(result.description()).isEqualTo("Bus");
        assertThat(result.deletedAt()).isNull();
    }

    @Test
    void get_throws_when_not_found() {
        UUID id = UUID.randomUUID();
        when(expenseRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.get(id))
            .isInstanceOf(ExpenseNotFoundException.class);
    }

    @Test
    void get_returns_expense_when_found() {
        UUID id = UUID.randomUUID();
        Expense expense = makeExpense(id);
        when(expenseRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(expense));

        Expense result = expenseService.get(id);
        assertThat(result.id()).isEqualTo(id);
    }

    @Test
    void delete_sets_deleted_at_via_save() {
        UUID id = UUID.randomUUID();
        Expense existing = makeExpense(id);
        when(expenseRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(existing));

        ArgumentCaptor<Expense> captor = ArgumentCaptor.forClass(Expense.class);
        when(expenseRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        expenseService.delete(id);

        assertThat(captor.getValue().deletedAt()).isNotNull();
        assertThat(captor.getValue().id()).isEqualTo(id);
        assertThat(captor.getValue().amount()).isEqualByComparingTo("50.00");
    }

    @Test
    void delete_throws_when_not_found() {
        UUID id = UUID.randomUUID();
        when(expenseRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> expenseService.delete(id))
            .isInstanceOf(ExpenseNotFoundException.class);
    }

    @Test
    void list_clamps_size_to_100() {
        Page<Expense> empty = new PageImpl<>(List.of());
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        when(expenseRepository.findAllByDeletedAtIsNull(any(), any(), any(), pageableCaptor.capture()))
            .thenReturn(empty);

        expenseService.list(null, PageRequest.of(0, 500));

        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(100);
    }

    @Test
    void list_passes_filter_through() {
        Page<Expense> empty = new PageImpl<>(List.of());
        ArgumentCaptor<ExpenseCategory> catCaptor = ArgumentCaptor.forClass(ExpenseCategory.class);
        ArgumentCaptor<LocalDate> fromCaptor = ArgumentCaptor.forClass(LocalDate.class);
        ArgumentCaptor<LocalDate> toCaptor = ArgumentCaptor.forClass(LocalDate.class);
        when(expenseRepository.findAllByDeletedAtIsNull(
            catCaptor.capture(), fromCaptor.capture(), toCaptor.capture(), any()))
            .thenReturn(empty);

        LocalDate from = LocalDate.of(2026, 5, 1);
        LocalDate to = LocalDate.of(2026, 5, 31);
        ExpenseFilter filter = new ExpenseFilter(ExpenseCategory.TRANSPORT, from, to);
        expenseService.list(filter, PageRequest.of(0, 10));

        assertThat(catCaptor.getValue()).isEqualTo(ExpenseCategory.TRANSPORT);
        assertThat(fromCaptor.getValue()).isEqualTo(from);
        assertThat(toCaptor.getValue()).isEqualTo(to);
    }

    @Test
    void summary_zero_fills_empty_months() {
        YearMonth month = YearMonth.of(2025, 12);
        when(expenseRepository.summaryForMonth(month)).thenReturn(List.of());

        MonthlySummary result = expenseService.summary(month);

        assertThat(result.grandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(result.totalCount()).isEqualTo(0);
        assertThat(result.byCategory()).isEmpty();
    }

    @Test
    void summary_sorts_by_total_desc() {
        YearMonth month = YearMonth.of(2026, 5);
        List<CategorySummary> rawItems = List.of(
            new CategorySummary(ExpenseCategory.FOOD_DRINK, new BigDecimal("100.00"), 3),
            new CategorySummary(ExpenseCategory.TRANSPORT, new BigDecimal("250.00"), 5)
        );
        when(expenseRepository.summaryForMonth(month)).thenReturn(rawItems);

        MonthlySummary result = expenseService.summary(month);

        assertThat(result.byCategory()).hasSize(2);
        assertThat(result.byCategory().get(0).category()).isEqualTo(ExpenseCategory.TRANSPORT);
        assertThat(result.byCategory().get(1).category()).isEqualTo(ExpenseCategory.FOOD_DRINK);
        assertThat(result.grandTotal()).isEqualByComparingTo("350.00");
        assertThat(result.totalCount()).isEqualTo(8);
    }

    @Test
    void summary_uses_clock_when_month_null() {
        when(expenseRepository.summaryForMonth(any())).thenReturn(List.of());

        MonthlySummary result = expenseService.summary(null);

        assertThat(result.month()).isEqualTo(YearMonth.of(2026, 5));
    }
}
