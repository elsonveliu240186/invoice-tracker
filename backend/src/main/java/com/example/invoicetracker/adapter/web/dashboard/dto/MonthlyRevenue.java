package com.example.invoicetracker.adapter.web.dashboard.dto;

import java.math.BigDecimal;

/**
 * Monthly revenue entry for a specific year-month.
 */
public record MonthlyRevenue(String month, BigDecimal revenue) {}
