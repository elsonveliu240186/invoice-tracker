package com.example.invoicetracker.adapter.web.dashboard;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.dashboard.dto.MonthlyRevenue;
import com.example.invoicetracker.application.dashboard.DashboardService;
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
        when(dashboardService.getStats()).thenReturn(stats);

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
}
