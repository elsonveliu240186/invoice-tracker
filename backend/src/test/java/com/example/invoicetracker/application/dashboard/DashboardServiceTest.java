package com.example.invoicetracker.application.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.ExpenseStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.MonthlyRevenue;
import com.example.invoicetracker.domain.expense.CategorySummary;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import com.example.invoicetracker.domain.expense.ExpenseRepository;
import com.example.invoicetracker.domain.expense.MonthlyExpense;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DashboardServiceTest {

    // Fixed clock at 2026-05-14 → current month is "2026-05"
    private static final Clock FIXED_CLOCK =
        Clock.fixed(Instant.parse("2026-05-14T12:00:00Z"), ZoneOffset.UTC);

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private ExpenseRepository expenseRepository;

    private DashboardService service;

    @BeforeEach
    void setUp() {
        service = new DashboardService(invoiceRepository, expenseRepository, FIXED_CLOCK);
    }

    /** Builds a List<Object[]> without triggering varargs/array type-inference ambiguity. */
    private static List<Object[]> rows(Object[]... arrays) {
        return Arrays.asList(arrays);
    }

    @Test
    void getStats_returns_correct_counts_and_revenue() {
        // Repo returns only 2 months of data; the other 4 must be zero-filled
        when(invoiceRepository.countByStatus()).thenReturn(rows(
            new Object[]{"DRAFT", 3L},
            new Object[]{"SENT", 2L},
            new Object[]{"PAID", 1L}
        ));
        when(invoiceRepository.revenueByStatus()).thenReturn(rows(
            new Object[]{"DRAFT", new BigDecimal("300.00")},
            new Object[]{"SENT", new BigDecimal("200.00")},
            new Object[]{"PAID", new BigDecimal("100.00")}
        ));
        // Only 2026-04 and 2026-05 have data; the earlier 4 months must be zero-filled
        when(invoiceRepository.revenueByMonth(6)).thenReturn(rows(
            new Object[]{"2026-04", new BigDecimal("50.00")},
            new Object[]{"2026-05", new BigDecimal("75.00")}
        ));

        DashboardStatsResponse stats = service.getStats();

        assertThat(stats.totalInvoices()).isEqualTo(6L);
        assertThat(stats.draftCount()).isEqualTo(3L);
        assertThat(stats.sentCount()).isEqualTo(2L);
        assertThat(stats.paidCount()).isEqualTo(1L);
        assertThat(stats.paidRevenue()).isEqualByComparingTo("100.00");
        assertThat(stats.totalRevenue()).isEqualByComparingTo("600.00");
        assertThat(stats.pendingRevenue()).isEqualByComparingTo("500.00");

        // Zero-fill: always exactly 6 entries, current month = "2026-05"
        List<MonthlyRevenue> months = stats.revenueByMonth();
        assertThat(months).hasSize(6);

        // Slots: 2025-12, 2026-01, 2026-02, 2026-03 → zero; 2026-04 and 2026-05 → data
        assertThat(months.get(0).month()).isEqualTo("2025-12");
        assertThat(months.get(0).revenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(months.get(1).month()).isEqualTo("2026-01");
        assertThat(months.get(1).revenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(months.get(2).month()).isEqualTo("2026-02");
        assertThat(months.get(2).revenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(months.get(3).month()).isEqualTo("2026-03");
        assertThat(months.get(3).revenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(months.get(4).month()).isEqualTo("2026-04");
        assertThat(months.get(4).revenue()).isEqualByComparingTo("50.00");
        assertThat(months.get(5).month()).isEqualTo("2026-05");
        assertThat(months.get(5).revenue()).isEqualByComparingTo("75.00");
    }

    @Test
    void getStats_returns_six_zero_filled_months_when_no_invoices() {
        when(invoiceRepository.countByStatus()).thenReturn(List.of());
        when(invoiceRepository.revenueByStatus()).thenReturn(List.of());
        when(invoiceRepository.revenueByMonth(6)).thenReturn(List.of());

        DashboardStatsResponse stats = service.getStats();

        assertThat(stats.totalInvoices()).isZero();
        assertThat(stats.draftCount()).isZero();
        assertThat(stats.sentCount()).isZero();
        assertThat(stats.paidCount()).isZero();
        assertThat(stats.totalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(stats.paidRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(stats.pendingRevenue()).isEqualByComparingTo(BigDecimal.ZERO);

        // Must return exactly 6 zero-filled entries
        List<MonthlyRevenue> months = stats.revenueByMonth();
        assertThat(months).hasSize(6);
        // First month: current (2026-05) minus 5 = 2025-12
        assertThat(months.get(0).month()).isEqualTo("2025-12");
        // Last month: current = 2026-05
        assertThat(months.get(5).month()).isEqualTo("2026-05");
        // All revenues zero
        months.forEach(m -> assertThat(m.revenue()).isEqualByComparingTo(BigDecimal.ZERO));
    }

    @Test
    void getStats_handles_null_revenue_values() {
        when(invoiceRepository.countByStatus()).thenReturn(rows(
            new Object[]{"DRAFT", 1L}
        ));
        when(invoiceRepository.revenueByStatus()).thenReturn(rows(
            new Object[]{"DRAFT", null}
        ));
        when(invoiceRepository.revenueByMonth(6)).thenReturn(rows(
            new Object[]{"2026-05", null}
        ));

        DashboardStatsResponse stats = service.getStats();

        assertThat(stats.totalRevenue()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(stats.paidRevenue()).isEqualByComparingTo(BigDecimal.ZERO);

        // Still 6 entries; the null-revenue month maps to zero
        List<MonthlyRevenue> months = stats.revenueByMonth();
        assertThat(months).hasSize(6);
        // 2026-05 is the last entry and was provided with null → mapped to zero
        assertThat(months.get(5).month()).isEqualTo("2026-05");
        assertThat(months.get(5).revenue()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getStats_handles_only_paid_invoices() {
        when(invoiceRepository.countByStatus()).thenReturn(rows(
            new Object[]{"PAID", 5L}
        ));
        when(invoiceRepository.revenueByStatus()).thenReturn(rows(
            new Object[]{"PAID", new BigDecimal("500.00")}
        ));
        when(invoiceRepository.revenueByMonth(6)).thenReturn(List.of());

        DashboardStatsResponse stats = service.getStats();

        assertThat(stats.totalInvoices()).isEqualTo(5L);
        assertThat(stats.draftCount()).isZero();
        assertThat(stats.sentCount()).isZero();
        assertThat(stats.paidCount()).isEqualTo(5L);
        assertThat(stats.paidRevenue()).isEqualByComparingTo("500.00");
        assertThat(stats.pendingRevenue()).isEqualByComparingTo(BigDecimal.ZERO);

        // Zero-fill still returns 6 entries
        assertThat(stats.revenueByMonth()).hasSize(6);
        stats.revenueByMonth().forEach(m ->
            assertThat(m.revenue()).isEqualByComparingTo(BigDecimal.ZERO));
    }

    // ─── getExpenseStats tests ───────────────────────────────────────────────

    @Test
    void getExpenseStats_zero_fills_six_months_when_no_data() {
        // Fixed clock: 2026-05-14 → window 2025-12-01 .. 2026-05-14
        when(expenseRepository.expenseByMonth(any(), any())).thenReturn(List.of());
        when(expenseRepository.expenseByCategoryInRange(any(), any())).thenReturn(List.of());

        ExpenseStatsResponse resp = service.getExpenseStats(null, null);

        assertThat(resp.expenseByMonth()).hasSize(6);
        assertThat(resp.expenseByMonth().get(0).month()).isEqualTo("2025-12");
        assertThat(resp.expenseByMonth().get(5).month()).isEqualTo("2026-05");
        resp.expenseByMonth().forEach(m ->
            assertThat(m.total()).isEqualByComparingTo(BigDecimal.ZERO));
        assertThat(resp.expenseByCategory()).isEmpty();
        assertThat(resp.grandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getExpenseStats_aggregates_totals_and_sorts_categories() {
        List<MonthlyExpense> monthlyRows = List.of(
            new MonthlyExpense("2026-04", new BigDecimal("100.00")),
            new MonthlyExpense("2026-05", new BigDecimal("200.00"))
        );
        List<CategorySummary> categoryRows = List.of(
            new CategorySummary(ExpenseCategory.FOOD_DRINK, new BigDecimal("150.00"), 5L),
            new CategorySummary(ExpenseCategory.TRANSPORT, new BigDecimal("100.00"), 3L),
            new CategorySummary(ExpenseCategory.HEALTH, new BigDecimal("50.00"), 2L)
        );
        when(expenseRepository.expenseByMonth(any(), any())).thenReturn(monthlyRows);
        when(expenseRepository.expenseByCategoryInRange(any(), any())).thenReturn(categoryRows);

        ExpenseStatsResponse resp = service.getExpenseStats(null, null);

        // 6 zero-filled months; 2026-04 and 2026-05 have data
        assertThat(resp.expenseByMonth()).hasSize(6);
        assertThat(resp.expenseByMonth().get(4).month()).isEqualTo("2026-04");
        assertThat(resp.expenseByMonth().get(4).total()).isEqualByComparingTo("100.00");
        assertThat(resp.expenseByMonth().get(5).month()).isEqualTo("2026-05");
        assertThat(resp.expenseByMonth().get(5).total()).isEqualByComparingTo("200.00");
        assertThat(resp.expenseByMonth().get(0).total()).isEqualByComparingTo(BigDecimal.ZERO);

        // Categories sorted by total desc
        assertThat(resp.expenseByCategory()).hasSize(3);
        assertThat(resp.expenseByCategory().get(0).category())
            .isEqualTo(ExpenseCategory.FOOD_DRINK);
        assertThat(resp.expenseByCategory().get(1).category())
            .isEqualTo(ExpenseCategory.TRANSPORT);

        // Grand total = sum of zero-filled months = 0+0+0+0+100+200 = 300
        assertThat(resp.grandTotal()).isEqualByComparingTo("300.00");
    }

    @Test
    void getExpenseStats_custom_range_passes_dates_through() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 3, 31);

        when(expenseRepository.expenseByMonth(from, to)).thenReturn(List.of());
        when(expenseRepository.expenseByCategoryInRange(from, to)).thenReturn(List.of());

        ExpenseStatsResponse resp = service.getExpenseStats(from, to);

        assertThat(resp.from()).isEqualTo("2026-01-01");
        assertThat(resp.to()).isEqualTo("2026-03-31");
        // 3 months: 2026-01, 2026-02, 2026-03
        assertThat(resp.expenseByMonth()).hasSize(3);
    }

    @Test
    void getExpenseStats_handles_null_sum_values() {
        List<MonthlyExpense> monthlyRows = List.of(
            new MonthlyExpense("2026-05", BigDecimal.ZERO)
        );
        when(expenseRepository.expenseByMonth(any(), any())).thenReturn(monthlyRows);
        when(expenseRepository.expenseByCategoryInRange(any(), any())).thenReturn(List.of());

        ExpenseStatsResponse resp = service.getExpenseStats(null, null);

        assertThat(resp.expenseByMonth().get(5).total()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(resp.grandTotal()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    void getExpenseStats_throws_when_range_exceeds_24_months() {
        LocalDate from = LocalDate.of(2024, 1, 1);
        LocalDate to = LocalDate.of(2026, 2, 28); // 26 months

        assertThatThrownBy(() -> service.getExpenseStats(from, to))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("24 months");
    }
}
