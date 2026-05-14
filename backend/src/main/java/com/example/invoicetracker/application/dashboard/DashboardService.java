package com.example.invoicetracker.application.dashboard;

import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.MonthlyRevenue;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.YearMonth;
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
 * Application service that aggregates invoice data for the dashboard.
 */
@Service
@Transactional(readOnly = true)
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);
    private static final int REVENUE_MONTHS = 6;

    private final InvoiceRepository invoiceRepository;
    private final Clock clock;

    /**
     * Constructs the service with the given repository and clock.
     *
     * @param invoiceRepository the invoice repository port
     * @param clock             the clock used to determine the current month
     */
    public DashboardService(InvoiceRepository invoiceRepository, Clock clock) {
        this.invoiceRepository = invoiceRepository;
        this.clock = clock;
    }

    /**
     * Computes dashboard statistics: counts by status, revenue totals, and monthly revenue.
     *
     * @return dashboard stats response
     */
    public DashboardStatsResponse getStats() {
        // Counts by status
        Map<String, Long> countMap = invoiceRepository.countByStatus().stream()
            .collect(Collectors.toMap(
                row -> String.valueOf(row[0]),
                row -> ((Number) row[1]).longValue()
            ));

        long draftCount = countMap.getOrDefault("DRAFT", 0L);
        long sentCount = countMap.getOrDefault("SENT", 0L);
        long paidCount = countMap.getOrDefault("PAID", 0L);
        long totalInvoices = draftCount + sentCount + paidCount;

        // Revenue by status
        Map<String, BigDecimal> revenueMap = invoiceRepository.revenueByStatus().stream()
            .collect(Collectors.toMap(
                row -> String.valueOf(row[0]),
                row -> row[1] != null ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO
            ));

        BigDecimal paidRevenue = revenueMap.getOrDefault("PAID", BigDecimal.ZERO);
        BigDecimal totalRevenue = revenueMap.values().stream()
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal pendingRevenue = totalRevenue.subtract(paidRevenue);

        // Monthly revenue for the last 6 months, zero-filled
        List<MonthlyRevenue> revenueByMonth = buildMonthlyRevenue(
            invoiceRepository.revenueByMonth(REVENUE_MONTHS));

        log.info("dashboard.stats requested: totalInvoices={}", totalInvoices);

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

    private List<MonthlyRevenue> buildMonthlyRevenue(List<Object[]> rows) {
        // Build a map from the repo rows
        Map<String, BigDecimal> repoMap = new LinkedHashMap<>();
        for (Object[] row : rows) {
            String month = (String) row[0];
            BigDecimal revenue = row[1] != null
                ? new BigDecimal(row[1].toString()) : BigDecimal.ZERO;
            repoMap.put(month, revenue);
        }

        // Produce exactly REVENUE_MONTHS slots, zero-filled
        YearMonth current = YearMonth.now(clock);
        List<MonthlyRevenue> result = new ArrayList<>(REVENUE_MONTHS);
        for (int i = REVENUE_MONTHS - 1; i >= 0; i--) {
            String label = current.minusMonths(i).toString(); // "YYYY-MM"
            BigDecimal revenue = repoMap.getOrDefault(label, BigDecimal.ZERO);
            result.add(new MonthlyRevenue(label, revenue));
        }
        return result;
    }
}
