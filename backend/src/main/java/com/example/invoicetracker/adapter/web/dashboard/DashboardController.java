package com.example.invoicetracker.adapter.web.dashboard;

import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.ExpenseStatsResponse;
import com.example.invoicetracker.application.dashboard.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.LocalDate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for dashboard statistics at /api/v1/dashboard.
 */
@RestController
@RequestMapping("/api/v1/dashboard")
@Tag(name = "Dashboard", description = "Aggregated statistics for the invoice dashboard")
public class DashboardController {

    private final DashboardService dashboardService;

    public DashboardController(DashboardService dashboardService) {
        this.dashboardService = dashboardService;
    }

    /**
     * Returns aggregated dashboard statistics with optional date filter.
     *
     * @param from optional start date (ISO YYYY-MM-DD)
     * @param to   optional end date (ISO YYYY-MM-DD)
     * @return 200 with dashboard stats
     */
    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics")
    public ResponseEntity<DashboardStatsResponse> getStats(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to
    ) {
        return ResponseEntity.ok(dashboardService.getStats(from, to));
    }

    /**
     * Returns expense statistics (monthly totals and per-category breakdown).
     *
     * @param from optional start date (ISO YYYY-MM-DD)
     * @param to   optional end date (ISO YYYY-MM-DD)
     * @return 200 with expense stats, or 400 if range is invalid
     */
    @GetMapping("/expense-stats")
    @Operation(summary = "Get expense statistics by month and category")
    public ResponseEntity<ExpenseStatsResponse> getExpenseStats(
        @RequestParam(required = false) LocalDate from,
        @RequestParam(required = false) LocalDate to
    ) {
        if (from != null && to != null && from.isAfter(to)) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(dashboardService.getExpenseStats(from, to));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
