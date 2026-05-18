package com.example.invoicetracker.adapter.web.dashboard;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.adapter.web.dashboard.dto.CategoryExpense;
import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.ExpenseStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.MonthlyRevenue;
import com.example.invoicetracker.application.dashboard.DashboardService;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import com.example.invoicetracker.domain.expense.MonthlyExpense;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK, classes = Application.class)
@Testcontainers
class DashboardControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    DashboardService dashboardService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    }

    @Test
    @WithMockUser
    void getStats_returns_200_with_stats() throws Exception {
        DashboardStatsResponse stats = new DashboardStatsResponse(
            6L, 3L, 2L, 1L,
            new BigDecimal("600.00"),
            new BigDecimal("100.00"),
            new BigDecimal("500.00"),
            List.of(
                new MonthlyRevenue("2026-04", new BigDecimal("200.00")),
                new MonthlyRevenue("2026-05", new BigDecimal("400.00"))
            )
        );
        when(dashboardService.getStats(any(), any())).thenReturn(stats);

        mvc.perform(get("/api/v1/dashboard/stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalInvoices").value(6))
            .andExpect(jsonPath("$.draftCount").value(3))
            .andExpect(jsonPath("$.sentCount").value(2))
            .andExpect(jsonPath("$.paidCount").value(1))
            .andExpect(jsonPath("$.totalRevenue").value(600.00))
            .andExpect(jsonPath("$.paidRevenue").value(100.00))
            .andExpect(jsonPath("$.pendingRevenue").value(500.00))
            .andExpect(jsonPath("$.revenueByMonth").isArray())
            .andExpect(jsonPath("$.revenueByMonth[0].month").value("2026-04"))
            .andExpect(jsonPath("$.revenueByMonth[1].month").value("2026-05"));
    }

    @Test
    void getStats_requires_auth_returns_401() throws Exception {
        mvc.perform(get("/api/v1/dashboard/stats"))
            .andExpect(status().isUnauthorized());
    }

    // ─── getExpenseStats tests ───────────────────────────────────────────────

    @Test
    @WithMockUser
    void getExpenseStats_returns_200_with_payload() throws Exception {
        List<MonthlyExpense> byMonth = List.of(
            new MonthlyExpense("2025-12", BigDecimal.ZERO),
            new MonthlyExpense("2026-01", BigDecimal.ZERO),
            new MonthlyExpense("2026-02", BigDecimal.ZERO),
            new MonthlyExpense("2026-03", BigDecimal.ZERO),
            new MonthlyExpense("2026-04", new BigDecimal("420.10")),
            new MonthlyExpense("2026-05", new BigDecimal("80.00"))
        );
        List<CategoryExpense> byCategory = List.of(
            new CategoryExpense(ExpenseCategory.FOOD_DRINK, new BigDecimal("420.10"), 12L)
        );
        ExpenseStatsResponse resp = new ExpenseStatsResponse(
            "2025-12-01", "2026-05-14",
            new BigDecimal("500.10"),
            byMonth, byCategory
        );
        when(dashboardService.getExpenseStats(any(), any())).thenReturn(resp);

        mvc.perform(get("/api/v1/dashboard/expense-stats"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.expenseByMonth[5].month").value("2026-05"))
            .andExpect(jsonPath("$.expenseByCategory[0].category").value("FOOD_DRINK"))
            .andExpect(jsonPath("$.grandTotal").value(500.10));
    }

    @Test
    @WithMockUser
    void getExpenseStats_returns_400_when_from_after_to() throws Exception {
        mvc.perform(get("/api/v1/dashboard/expense-stats")
                .param("from", "2026-05-01")
                .param("to", "2026-01-01"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void getExpenseStats_returns_400_when_service_throws_illegal_argument() throws Exception {
        when(dashboardService.getExpenseStats(any(), any()))
            .thenThrow(new IllegalArgumentException("Date range exceeds the maximum allowed window of 24 months"));

        mvc.perform(get("/api/v1/dashboard/expense-stats")
                .param("from", "2024-01-01")
                .param("to", "2026-02-28"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void getExpenseStats_requires_auth_returns_401() throws Exception {
        mvc.perform(get("/api/v1/dashboard/expense-stats"))
            .andExpect(status().isUnauthorized());
    }
}
