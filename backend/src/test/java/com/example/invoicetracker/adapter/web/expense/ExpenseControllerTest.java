package com.example.invoicetracker.adapter.web.expense;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.application.expense.ExpenseFilter;
import com.example.invoicetracker.application.expense.ExpenseService;
import com.example.invoicetracker.application.expense.MonthlySummary;
import com.example.invoicetracker.domain.expense.Expense;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import com.example.invoicetracker.domain.expense.ExpenseNotFoundException;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@Testcontainers
class ExpenseControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    ExpenseService expenseService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    }

    private Expense makeExpense(UUID id) {
        Instant now = Instant.parse("2026-05-16T10:00:00Z");
        return new Expense(id, new BigDecimal("50.00"), ExpenseCategory.FOOD_DRINK,
            "Lunch", LocalDate.of(2026, 5, 16), now, now, null);
    }

    @Test
    @WithMockUser
    void create_returns_201_with_location() throws Exception {
        UUID id = UUID.randomUUID();
        Expense expense = makeExpense(id);
        when(expenseService.create(any(), any(), any(), any())).thenReturn(expense);

        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":50.00,"category":"FOOD_DRINK","expenseDate":"2026-05-16"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location",
                org.hamcrest.Matchers.endsWith("/api/v1/expenses/" + id)))
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.amount").value(50.00))
            .andExpect(jsonPath("$.category").value("FOOD_DRINK"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_amount_zero() throws Exception {
        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":0,"category":"FOOD_DRINK","expenseDate":"2026-05-16"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_amount_negative() throws Exception {
        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":-1,"category":"FOOD_DRINK","expenseDate":"2026-05-16"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_amount_too_large() throws Exception {
        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":10000000.00,"category":"FOOD_DRINK","expenseDate":"2026-05-16"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_category_unknown() throws Exception {
        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":10.00,"category":"XYZ","expenseDate":"2026-05-16"}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void create_returns_400_when_date_in_future() throws Exception {
        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":10.00,"category":"FOOD_DRINK","expenseDate":"2099-01-01"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_description_too_long() throws Exception {
        String longDesc = "a".repeat(501);
        mvc.perform(post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":10.00,"category":"FOOD_DRINK","expenseDate":"2026-05-16",
                     "description":"%s"}
                    """.formatted(longDesc)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void list_filters_by_category() throws Exception {
        Page<Expense> empty = new PageImpl<>(List.of());
        ArgumentCaptor<ExpenseFilter> filterCaptor = ArgumentCaptor.forClass(ExpenseFilter.class);
        when(expenseService.list(filterCaptor.capture(), any(Pageable.class))).thenReturn(empty);

        mvc.perform(get("/api/v1/expenses").param("category", "FOOD_DRINK"))
            .andExpect(status().isOk());

        assertThat(filterCaptor.getValue().category()).isEqualTo(ExpenseCategory.FOOD_DRINK);
    }

    @Test
    @WithMockUser
    void list_filters_by_date_range() throws Exception {
        Page<Expense> empty = new PageImpl<>(List.of());
        ArgumentCaptor<ExpenseFilter> filterCaptor = ArgumentCaptor.forClass(ExpenseFilter.class);
        when(expenseService.list(filterCaptor.capture(), any(Pageable.class))).thenReturn(empty);

        mvc.perform(get("/api/v1/expenses")
                .param("dateFrom", "2026-05-01")
                .param("dateTo", "2026-05-31"))
            .andExpect(status().isOk());

        assertThat(filterCaptor.getValue().dateFrom()).isEqualTo(LocalDate.of(2026, 5, 1));
        assertThat(filterCaptor.getValue().dateTo()).isEqualTo(LocalDate.of(2026, 5, 31));
    }

    @Test
    @WithMockUser
    void get_returns_404_when_missing() throws Exception {
        UUID id = UUID.randomUUID();
        when(expenseService.get(id)).thenThrow(new ExpenseNotFoundException(id));

        mvc.perform(get("/api/v1/expenses/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("EXPENSE_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void get_returns_200() throws Exception {
        UUID id = UUID.randomUUID();
        when(expenseService.get(id)).thenReturn(makeExpense(id));

        mvc.perform(get("/api/v1/expenses/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    @WithMockUser
    void update_returns_200() throws Exception {
        UUID id = UUID.randomUUID();
        when(expenseService.update(eq(id), any(), any(), any(), any()))
            .thenReturn(makeExpense(id));

        mvc.perform(put("/api/v1/expenses/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":75.00,"category":"TRANSPORT","expenseDate":"2026-05-10"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    @WithMockUser
    void update_returns_404_when_not_found() throws Exception {
        UUID id = UUID.randomUUID();
        when(expenseService.update(eq(id), any(), any(), any(), any()))
            .thenThrow(new ExpenseNotFoundException(id));

        mvc.perform(put("/api/v1/expenses/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"amount":75.00,"category":"TRANSPORT","expenseDate":"2026-05-10"}
                    """))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void delete_returns_204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(expenseService).delete(id);

        mvc.perform(delete("/api/v1/expenses/{id}", id))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser
    void delete_returns_404_when_not_found() throws Exception {
        UUID id = UUID.randomUUID();
        doThrow(new ExpenseNotFoundException(id)).when(expenseService).delete(id);

        mvc.perform(delete("/api/v1/expenses/{id}", id))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    void summary_default_month_is_current() throws Exception {
        MonthlySummary summary = new MonthlySummary(
            YearMonth.of(2026, 5), BigDecimal.ZERO, 0, List.of());
        when(expenseService.summary(isNull())).thenReturn(summary);

        mvc.perform(get("/api/v1/expenses/summary"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.month").value("2026-05"))
            .andExpect(jsonPath("$.totalCount").value(0));

        verify(expenseService).summary(null);
    }

    @Test
    @WithMockUser
    void summary_returns_400_when_month_malformed() throws Exception {
        mvc.perform(get("/api/v1/expenses/summary").param("month", "2026-13"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void summary_with_valid_month_param() throws Exception {
        MonthlySummary summary = new MonthlySummary(
            YearMonth.of(2026, 3), new BigDecimal("100.00"), 2, List.of());
        when(expenseService.summary(YearMonth.of(2026, 3))).thenReturn(summary);

        mvc.perform(get("/api/v1/expenses/summary").param("month", "2026-03"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.month").value("2026-03"));
    }

    @Test
    void unauthenticated_returns_401() throws Exception {
        mvc.perform(get("/api/v1/expenses"))
            .andExpect(status().isUnauthorized());
    }

}
