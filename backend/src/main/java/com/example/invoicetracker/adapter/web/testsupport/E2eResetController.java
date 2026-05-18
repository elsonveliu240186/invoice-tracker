package com.example.invoicetracker.adapter.web.testsupport;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Test-support endpoint registered exclusively in the {@code e2e} Spring profile.
 *
 * <p>{@code POST /api/v1/test-support/reset} truncates all business tables in FK-safe order
 * and resets the singleton {@code company_profile} row to blank values, returning HTTP 204.
 * The endpoint is protected by HTTP Basic auth (inherited from the global {@link
 * com.example.invoicetracker.config.SecurityConfig}) — an unauthenticated request gets 401.
 *
 * <p>This controller is intentionally absent from every non-{@code e2e} profile and will
 * return HTTP 404 when the application is started without the {@code e2e} profile.
 */
@RestController
@Profile("e2e")
@RequestMapping("/api/v1/test-support")
public class E2eResetController {

    private static final Logger log = LoggerFactory.getLogger(E2eResetController.class);

    private final JdbcTemplate jdbcTemplate;

    /**
     * Creates the controller with the provided {@link JdbcTemplate}.
     *
     * @param jdbcTemplate the JDBC template used to execute truncate/update statements
     */
    public E2eResetController(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Resets the database to a clean state for the next E2E test run.
     *
     * <p>Tables are truncated in FK-safe order (children before parents):
     * <ol>
     *   <li>invoice_generated_artifacts</li>
     *   <li>invoice_lines</li>
     *   <li>invoices</li>
     *   <li>expenses</li>
     *   <li>clients</li>
     *   <li>app_users</li>
     * </ol>
     * The singleton {@code company_profile} row (id=1) is reset to all-blank strings.
     *
     * @return 204 No Content
     */
    @PostMapping("/reset")
    public ResponseEntity<Void> reset() {
        jdbcTemplate.update("TRUNCATE TABLE invoice_generated_artifacts CASCADE");
        jdbcTemplate.update("TRUNCATE TABLE invoice_lines CASCADE");
        jdbcTemplate.update("TRUNCATE TABLE invoices CASCADE");
        jdbcTemplate.update("TRUNCATE TABLE expenses CASCADE");
        jdbcTemplate.update("TRUNCATE TABLE clients CASCADE");
        jdbcTemplate.update("TRUNCATE TABLE app_users CASCADE");
        jdbcTemplate.update(
            "UPDATE company_profile SET name='', address='', phone='', email='',"
                + " vat_number='', iban='', swift_bic='', bank_name='' WHERE id=1"
        );
        log.info("E2E reset executed");
        return ResponseEntity.noContent().build();
    }
}
