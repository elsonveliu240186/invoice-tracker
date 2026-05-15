package com.example.invoicetracker.adapter.web.dashboard.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * Dashboard statistics response with invoice counts and revenue summaries.
 */
public record DashboardStatsResponse(
    long totalInvoices,
    long draftCount,
    long sentCount,
    long paidCount,
    BigDecimal totalRevenue,
    BigDecimal paidRevenue,
    BigDecimal pendingRevenue,
    List<MonthlyRevenue> revenueByMonth
) {}
