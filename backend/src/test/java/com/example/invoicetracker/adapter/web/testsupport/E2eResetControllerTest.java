package com.example.invoicetracker.adapter.web.testsupport;

import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * MockMvc slice test for {@link E2eResetController}.
 *
 * <p>The {@link JdbcTemplate} is replaced by a Mockito mock so the test does not
 * need a running database. The {@code e2e} profile is active so that Spring registers
 * the controller bean.
 */
@SpringBootTest(
    webEnvironment = WebEnvironment.MOCK,
    properties = "spring.profiles.active=e2e"
)
@Testcontainers
class E2eResetControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    JdbcTemplate jdbcTemplate;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        // stub update() so it doesn't throw when called
        when(jdbcTemplate.update(org.mockito.ArgumentMatchers.anyString())).thenReturn(0);

        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    }

    @Test
    @WithMockUser
    void reset_with_auth_returns_204() throws Exception {
        mvc.perform(post("/api/v1/test-support/reset"))
            .andExpect(status().isNoContent());
    }

    @Test
    void reset_without_auth_returns_401() throws Exception {
        mvc.perform(post("/api/v1/test-support/reset"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void reset_executes_truncate_for_each_table() throws Exception {
        mvc.perform(post("/api/v1/test-support/reset"))
            .andExpect(status().isNoContent());

        // 6 TRUNCATE statements + 1 UPDATE = 7 update() calls total
        verify(jdbcTemplate, times(7)).update(org.mockito.ArgumentMatchers.anyString());
        verify(jdbcTemplate).update(
            "TRUNCATE TABLE invoice_generated_artifacts CASCADE");
        verify(jdbcTemplate).update("TRUNCATE TABLE invoice_lines CASCADE");
        verify(jdbcTemplate).update("TRUNCATE TABLE invoices CASCADE");
        verify(jdbcTemplate).update("TRUNCATE TABLE expenses CASCADE");
        verify(jdbcTemplate).update("TRUNCATE TABLE clients CASCADE");
        verify(jdbcTemplate).update("TRUNCATE TABLE app_users CASCADE");
        verify(jdbcTemplate).update(
            "UPDATE company_profile SET name='', address='', phone='', email='',"
                + " vat_number='', iban='', swift_bic='', bank_name='' WHERE id=1"
        );
    }
}
