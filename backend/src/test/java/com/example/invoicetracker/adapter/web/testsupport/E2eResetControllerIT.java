package com.example.invoicetracker.adapter.web.testsupport;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Full-stack integration test for {@link E2eResetController}.
 *
 * <p>The {@code e2e} Spring profile is active. The test seeds a user, a client, and an invoice
 * (with one line) directly via JDBC, then calls {@code POST /api/v1/test-support/reset} and
 * asserts that all business tables are empty and the {@code company_profile} row is blank.
 */
@SpringBootTest(
    webEnvironment = WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.profiles.active=e2e",
        "spring.security.user.name=admin",
        "spring.security.user.password=Secret1!",
        "spring.mail.host=localhost",
        "spring.mail.port=3025"
    }
)
@Testcontainers
class E2eResetControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @LocalServerPort
    int port;

    @Autowired
    JdbcTemplate jdbc;

    private RestClient authClient() {
        return RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultHeaders(h -> h.setBasicAuth("admin", "Secret1!"))
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> { /* let caller assert */ })
            .build();
    }

    @Test
    void reset_clears_all_business_tables() {
        // Seed a user
        UUID userId = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO app_users (id, email, display_name, password_hash)"
                + " VALUES (?, ?, ?, ?)",
            userId, "e2e-user@test.local", "E2E User",
            "$2a$12$WJsH2oWLRQj0pPOCbnX7L.0S7GN.lbKq0K4MZmBsUMC9PxJKKlFHa"
        );

        // Seed a client
        UUID clientId = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO clients (id, name, email) VALUES (?, ?, ?)",
            clientId, "E2E Client", "e2e-client@test.local"
        );

        // Seed company_profile name so we can verify it gets blanked
        jdbc.update("UPDATE company_profile SET name='E2E Corp' WHERE id=1");

        // Seed an invoice + line
        UUID invoiceId = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO invoices (id, number, client_id, issue_date, due_date)"
                + " VALUES (?, ?, ?, CURRENT_DATE, CURRENT_DATE + 30)",
            invoiceId, "E2E-INV-001", clientId
        );
        UUID lineId = UUID.randomUUID();
        jdbc.update(
            "INSERT INTO invoice_lines (id, invoice_id, description, quantity, unit_price)"
                + " VALUES (?, ?, ?, ?, ?)",
            lineId, invoiceId, "E2E Service", 1, new BigDecimal("100.00")
        );

        // Verify data was seeded
        assertThat(countRows("app_users")).isGreaterThan(0);
        assertThat(countRows("clients")).isGreaterThan(0);
        assertThat(countRows("invoices")).isGreaterThan(0);
        assertThat(countRows("invoice_lines")).isGreaterThan(0);

        // Call reset
        ResponseEntity<Void> response = authClient().post()
            .uri("/api/v1/test-support/reset")
            .contentType(MediaType.APPLICATION_JSON)
            .retrieve()
            .toBodilessEntity();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // Assert all business tables are now empty
        assertThat(countRows("invoice_generated_artifacts")).isZero();
        assertThat(countRows("invoice_lines")).isZero();
        assertThat(countRows("invoices")).isZero();
        assertThat(countRows("clients")).isZero();
        assertThat(countRows("app_users")).isZero();

        // Assert company_profile is blanked (not deleted, just reset)
        String name = jdbc.queryForObject(
            "SELECT name FROM company_profile WHERE id=1", String.class);
        assertThat(name).isEmpty();
    }

    @Test
    void reset_without_auth_returns_401() {
        RestClient noAuth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> { /* let caller assert */ })
            .build();

        ResponseEntity<String> response = noAuth.post()
            .uri("/api/v1/test-support/reset")
            .retrieve()
            .toEntity(String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    private int countRows(String table) {
        Integer count = jdbc.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
        return count == null ? 0 : count;
    }
}
