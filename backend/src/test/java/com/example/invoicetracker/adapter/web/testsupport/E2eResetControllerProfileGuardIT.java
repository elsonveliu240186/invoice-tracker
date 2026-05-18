package com.example.invoicetracker.adapter.web.testsupport;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration test that verifies {@link E2eResetController} is NOT registered when the
 * {@code e2e} Spring profile is absent.
 *
 * <p>The application starts on the default profile (no {@code e2e}), so
 * {@code POST /api/v1/test-support/reset} must return HTTP 404.
 */
@SpringBootTest(
    webEnvironment = WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.security.user.name=user",
        "spring.security.user.password=password"
    }
)
@Testcontainers
class E2eResetControllerProfileGuardIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @LocalServerPort
    int port;

    @Test
    void reset_endpoint_returns_404_when_e2e_profile_is_inactive() {
        RestClient client = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultHeaders(h -> h.setBasicAuth("user", "password"))
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> { /* let caller assert */ })
            .build();

        ResponseEntity<String> response = client.post()
            .uri("/api/v1/test-support/reset")
            .retrieve()
            .toEntity(String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
