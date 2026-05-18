package com.example.invoicetracker.application.dashboard;

import com.example.invoicetracker.adapter.web.dashboard.dto.CategoryExpense;
import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.ExpenseStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.MonthlyRevenue;
import com.example.invoicetracker.domain.expense.CategorySummary;
import com.example.invoicetracker.domain.expense.ExpenseRepository;
import com.example.invoicetracker.domain.expense.MonthlyExpense;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service that aggregates invoice and expense data for the dashboard.
 */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);
    private static final int DEFAULT_MONTHS = 6;
    private static final int MAX_MONTHS = 24;

    private final InvoiceRepository invoiceRepository;
    private final ExpenseRepository expenseRepository;
    private final Clock clock;

    /**
     * Constructs the service with the given repositories and clock.
     *
     * @param invoiceRepository the invoice repository port
     * @param expenseRepository the expense repository port
     * @param clock             the clock used to determine the current month
     */
    public DashboardService(
        InvoiceRepository invoiceRepository,
        ExpenseRepository expenseRepository,
        Clock clock
    ) {
        this.invoiceRepository = invoiceRepository;
        this.expenseRepository = expenseRepository;
        this.clock = clock;
    }

    /**
     * Computes dashboard statistics with optional date filter.
     * When {@code from}/{@code to} are both null, returns all-time stats with a 6-month chart.
     * When either is provided, restricts all counts and revenues to invoices whose issue_date
     * falls in [effectiveFrom, effectiveTo].
     *
     * @param from optional start date; null with null to defaults to all-time stats
     * @param to   optional end date; null with null to defaults to all-time stats
     * @return dashboard stats response
     */
    public DashboardStatsResponse getStats(LocalDate from, LocalDate to) {
        final Map<String, Long> countMap;
        final Map<String, BigDecimal> revenueMap;
        final List<MonthlyRevenue> revenueByMonth;

        if (from == null && to == null) {
            // All-time stats; chart covers last DEFAULT_MONTHS months
            countMap = invoiceRepository.countByStatus().stream()
                .collect(Collectors.toMap(
                    row -> String.valueOf(row[0]),
                    row -> ((Number) row[1]).longValue()
                ));
            revenueMap = invoiceRepository.revenueByStatus().stream()
                .collect(Collectors.toMap(
                    row -> String.valueOf(row[0]),
                    row -> row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
                ));
            revenueByMonth = buildMonthlyRevenue(invoiceRepository.revenueByMonth(DEFAULT_MONTHS));
        } else {
            // Date-filtered stats
            LocalDate effectiveFrom = from != null ? from
                : YearMonth.now(clock).minusMonths(DEFAULT_MONTHS - 1L).atDay(1);
            LocalDate effectiveTo = to != null ? to : LocalDate.now(clock);

            countMap = invoiceRepository.countByStatusInRange(effectiveFrom, effectiveTo).stream()
                .collect(Collectors.toMap(
                    row -> String.valueOf(row[0]),
                    row -> ((Number) row[1]).longValue()
                ));
            revenueMap = invoiceRepository
                .revenueByStatusInRange(effectiveFrom, effectiveTo).stream()
                .collect(Collectors.toMap(
                    row -> String.valueOf(row[0]),
                    row -> row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
                ));
            YearMonth fromMonth = YearMonth.from(effectiveFrom);
            YearMonth toMonth = YearMonth.from(effectiveTo);
            revenueByMonth = buildMonthlyRevenueInRange(
                invoiceRepository.revenueByMonthInRange(effectiveFrom, effectiveTo),
                fromMonth,
                toMonth
            );
        }

        long draftCount = countMap.getOrDefault("DRAFT", 0L);
        long sentCount = countMap.getOrDefault("SENT", 0L);
        long paidCount = countMap.getOrDefault("PAID", 0L);
        long totalInvoices = draftCount + sentCount + paidCount;

        BigDecimal paidRevenue = revenueMap.getOrDefault("PAID", BigDecimal.ZERO);
        BigDecimal totalRevenue = revenueMap.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingRevenue = totalRevenue.subtract(paidRevenue);

        log.info("dashboard.stats requested: from={} to={} totalInvoices={}", from, to,
            totalInvoices);

        return new DashboardStatsResponse(
            totalInvoices,
            draftCount,
            sentCount,
            paidCount,
            totalRevenue,
            paidRevenue,
            pendingRevenue,
            revenueByMonth
        );
    }

    /**
     * Backward-compatible overload that uses the default 6-month window.
     *
     * @return dashboard stats response
     */
    public DashboardStatsResponse getStats() {
        return getStats(null, null);
    }

    /**
     * Computes expense statistics: monthly totals and per-category breakdown.
     * When {@code from}/{@code to} are null, defaults to the last 6 months.
     * Maximum window is 24 months; if exceeded an {@link IllegalArgumentException} is thrown.
     *
     * @param from optional start date; null defaults to first day of month 5 months ago
     * @param to   optional end date; null defaults to today
     * @return expense stats response
     * @throws IllegalArgumentException if from &gt; to or the window exceeds 24 months
     */
    public ExpenseStatsResponse getExpenseStats(LocalDate from, LocalDate to) {
        LocalDate effectiveFrom;
        LocalDate effectiveTo;

        if (from == null && to == null) {
            effectiveTo = LocalDate.now(clock);
            effectiveFrom = YearMonth.now(clock).minusMonths(DEFAULT_MONTHS - 1L).atDay(1);
        } else {
            effectiveFrom = from;
            effectiveTo = to;
        }

        if (effectiveFrom.isAfter(effectiveTo)) {
            throw new IllegalArgumentException("from date must not be after to date");
        }

        YearMonth fromMonth = YearMonth.from(effectiveFrom);
        YearMonth toMonth = YearMonth.from(effectiveTo);
        long monthsBetween = fromMonth.until(toMonth, ChronoUnit.MONTHS) + 1;
        if (monthsBetween > MAX_MONTHS) {
            throw new IllegalArgumentException(
                "Date range exceeds the maximum allowed window of 24 months");
        }

        List<MonthlyExpense> rawMonthly =
            expenseRepository.expenseByMonth(effectiveFrom, effectiveTo);
        List<CategorySummary> rawCategory =
            expenseRepository.expenseByCategoryInRange(effectiveFrom, effectiveTo);

        List<MonthlyExpense> expenseByMonth =
            zeroFillMonths(rawMonthly, fromMonth, toMonth);

        List<CategoryExpense> expenseByCategory = rawCategory.stream()
            .map(cs -> new CategoryExpense(cs.category(), cs.total(), cs.count()))
            .toList();

        BigDecimal grandTotal = expenseByMonth.stream()
            .map(MonthlyExpense::total)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        log.info("dashboard.expenseStats from={} to={} grandTotal={}",
            effectiveFrom, effectiveTo, grandTotal);

        return new ExpenseStatsResponse(
            effectiveFrom.toString(),
            effectiveTo.toString(),
            grandTotal,
            expenseByMonth,
            expenseByCategory
        );
    }

    private List<MonthlyExpense> zeroFillMonths(
        List<MonthlyExpense> rawMonthly,
        YearMonth fromMonth,
        YearMonth toMonth
    ) {
        Map<String, BigDecimal> repoMap = new LinkedHashMap<>();
        for (MonthlyExpense entry : rawMonthly) {
            repoMap.put(entry.month(), entry.total());
        }
        List<MonthlyExpense> result = new ArrayList<>();
        YearMonth current = fromMonth;
        while (!current.isAfter(toMonth)) {
            String label = current.toString();
            result.add(new MonthlyExpense(label,
                repoMap.getOrDefault(label, BigDecimal.ZERO)));
            current = current.plusMonths(1);
        }
        return result;
    }

    private List<MonthlyRevenue> buildMonthlyRevenue(List<Object[]> rows) {
        Map<String, BigDecimal> repoMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String month = (String) row[0];
            BigDecimal revenue = row[1] != null
                ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            repoMap.put(month, revenue);
        }
        YearMonth current = YearMonth.now(clock);
        List<MonthlyRevenue> result = new ArrayList<>(DEFAULT_MONTHS);
        for (int i = DEFAULT_MONTHS - 1; i >= 0; i--) {
            String label = current.minusMonths(i).toString();
            BigDecimal revenue = repoMap.getOrDefault(label, BigDecimal.ZERO);
            result.add(new MonthlyRevenue(label, revenue));
        }
        return result;
    }

    private List<MonthlyRevenue> buildMonthlyRevenueInRange(
        List<Object[]> rows,
        YearMonth fromMonth,
        YearMonth toMonth
    ) {
        Map<String, BigDecimal> repoMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String month = (String) row[0];
            BigDecimal revenue = row[1] != null
                ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            repoMap.put(month, revenue);
        }
        List<MonthlyRevenue> result = new ArrayList<>();
        YearMonth current = fromMonth;
        while (!current.isAfter(toMonth)) {
            String label = current.toString();
            result.add(new MonthlyRevenue(label, repoMap.getOrDefault(label, BigDecimal.ZERO)));
            current = current.plusMonths(1);
        }
        return result;
    }
}
