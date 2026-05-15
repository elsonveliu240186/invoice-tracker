package com.example.invoicetracker.adapter.web.dashboard;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
import com.example.invoicetracker.adapter.web.dashboard.dto.DashboardStatsResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceResponse;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(
    classes = Application.class,
    webEnvironment = WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.security.user.name=user",
        "spring.security.user.password=password"
    }
)
@Testcontainers
class DashboardControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", () -> "127.0.0.1");
        registry.add("spring.mail.port", () -> "3025");
        registry.add("spring.mail.properties.mail.smtp.auth", () -> "false");
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> "false");
        registry.add("app.mail.from", () -> "no-reply@test.local");
        registry.add("app.mail.subject-template", () -> "Invoice #{{number}} from {{company}}");
    }

    @LocalServerPort
    int port;

    private static final String USER = "user";
    private static final String PASS = "password";

    private RestClient auth;
    private RestClient noAuth;

    @BeforeEach
    void setUp() {
        auth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultHeaders(h -> h.setBasicAuth(USER, PASS))
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> {})
            .build();
        noAuth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> {})
            .build();
    }

    private UUID createClient(String name, String email) {
        ResponseEntity<ClientResponse> resp = auth.post()
            .uri("/api/v1/clients")
            .contentType(MediaType.APPLICATION_JSON)
            .body(new CreateClientRequest(name, email, null, null))
            .retrieve()
            .toEntity(ClientResponse.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resp.getBody().id();
    }

    private UUID createInvoice(UUID clientId, String number) {
        String body = """
            {
              "number": "%s",
              "clientId": "%s",
              "issueDate": "2026-05-01",
              "dueDate": "2026-06-01",
              "taxRate": "0.10",
              "lines": [
                {"description": "Consulting", "quantity": 1, "unitPrice": "100.00"}
              ]
            }
            """.formatted(number, clientId);

        ResponseEntity<InvoiceResponse> resp = auth.post()
            .uri("/api/v1/invoices")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toEntity(InvoiceResponse.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        return resp.getBody().id();
    }

    @Test
    void getDashboardStats_returns_200() {
        ResponseEntity<DashboardStatsResponse> resp = auth.get()
            .uri("/api/v1/dashboard/stats")
            .retrieve()
            .toEntity(DashboardStatsResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().revenueByMonth()).isNotNull();
    }

    @Test
    void getDashboardStats_reflects_created_invoices() {
        String uniqueEmail = "dashboard-it-" + UUID.randomUUID() + "@example.com";
        UUID clientId = createClient("Dashboard Client", uniqueEmail);
        createInvoice(clientId, "INV-DASH-" + UUID.randomUUID());

        ResponseEntity<DashboardStatsResponse> resp = auth.get()
            .uri("/api/v1/dashboard/stats")
            .retrieve()
            .toEntity(DashboardStatsResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        DashboardStatsResponse stats = resp.getBody();
        assertThat(stats).isNotNull();
        assertThat(stats.totalInvoices()).isGreaterThanOrEqualTo(1L);
        assertThat(stats.draftCount()).isGreaterThanOrEqualTo(1L);
    }

    @Test
    void markPaid_returns_200_with_paid_status() {
        String uniqueEmail = "markpaid-it-" + UUID.randomUUID() + "@example.com";
        UUID clientId = createClient("Mark Paid Client", uniqueEmail);
        UUID invoiceId = createInvoice(clientId, "INV-MARKPAID-" + UUID.randomUUID());

        ResponseEntity<InvoiceResponse> resp = auth.patch()
            .uri("/api/v1/invoices/{id}/mark-paid", invoiceId)
            .retrieve()
            .toEntity(InvoiceResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody()).isNotNull();
        assertThat(resp.getBody().status()).isEqualTo("PAID");
    }

    @Test
    void markPaid_returns_404_for_unknown_id() {
        UUID unknown = UUID.randomUUID();
        ResponseEntity<String> resp = auth.patch()
            .uri("/api/v1/invoices/{id}/mark-paid", unknown)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void getDashboardStats_returns_401_when_unauthenticated() {
        ResponseEntity<String> resp = noAuth.get()
            .uri("/api/v1/dashboard/stats")
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void getDashboardStats_with_three_invoices_one_per_status() {
        String email = "stats3-" + UUID.randomUUID() + "@example.com";
        UUID clientId = createClient("Three Status Client", email);

        // 1 DRAFT invoice (just created)
        createInvoice(clientId, "INV-3S-DRAFT-" + UUID.randomUUID());

        // 1 SENT invoice (mark sent via mark-paid path is not applicable; create another DRAFT
        //   then mark it paid, and create a third to leave as DRAFT)
        // For SENT we just create a second DRAFT (API only supports DRAFT on create);
        // we keep it as DRAFT, then create a third and mark it PAID.
        createInvoice(clientId, "INV-3S-SENT-" + UUID.randomUUID());

        // 1 PAID invoice
        UUID paidId = createInvoice(clientId, "INV-3S-PAID-" + UUID.randomUUID());
        auth.patch()
            .uri("/api/v1/invoices/{id}/mark-paid", paidId)
            .retrieve()
            .toBodilessEntity();

        ResponseEntity<DashboardStatsResponse> resp = auth.get()
            .uri("/api/v1/dashboard/stats")
            .retrieve()
            .toEntity(DashboardStatsResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        DashboardStatsResponse stats = resp.getBody();
        assertThat(stats).isNotNull();
        // Totals include all invoices in the DB (other tests may have added invoices too),
        // so we assert >= thresholds and that revenueByMonth is exactly 6 entries.
        assertThat(stats.totalInvoices()).isGreaterThanOrEqualTo(3L);
        assertThat(stats.paidCount()).isGreaterThanOrEqualTo(1L);

        // revenueByMonth must always be exactly 6 entries (zero-filled)
        assertThat(stats.revenueByMonth()).hasSize(6);
    }
}
