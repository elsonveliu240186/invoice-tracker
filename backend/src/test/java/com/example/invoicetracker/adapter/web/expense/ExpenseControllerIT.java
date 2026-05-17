package com.example.invoicetracker.adapter.web.expense;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.adapter.web.expense.dto.CreateExpenseRequest;
import com.example.invoicetracker.adapter.web.expense.dto.ExpenseResponse;
import com.example.invoicetracker.adapter.web.expense.dto.ExpenseSummaryResponse;
import com.example.invoicetracker.adapter.web.expense.dto.UpdateExpenseRequest;
import com.example.invoicetracker.domain.expense.ExpenseCategory;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(
    webEnvironment = WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.security.user.name=user",
        "spring.security.user.password=password"
    }
)
@Testcontainers
class ExpenseControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @LocalServerPort
    int port;

    private static final String BASE_URL = "/api/v1/expenses";
    private static final String USER = "user";
    private static final String PASS = "password";

    private RestClient auth() {
        return RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultHeaders(h -> h.setBasicAuth(USER, PASS))
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> { /* let caller assert */ })
            .build();
    }

    private RestClient noAuth() {
        return RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> { /* let caller assert */ })
            .build();
    }

    private CreateExpenseRequest buildCreate(BigDecimal amount, ExpenseCategory category,
        LocalDate date) {
        return new CreateExpenseRequest(amount, category, null, date);
    }

    @Test
    void full_crud_flow() {
        // POST → create
        CreateExpenseRequest createReq = buildCreate(
            new BigDecimal("123.45"), ExpenseCategory.FOOD_DRINK, LocalDate.of(2026, 5, 1));

        ResponseEntity<ExpenseResponse> created = auth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(createReq)
            .retrieve()
            .toEntity(ExpenseResponse.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getHeaders().getLocation()).isNotNull();
        ExpenseResponse body = created.getBody();
        assertThat(body).isNotNull();
        UUID id = body.id();
        assertThat(id).isNotNull();
        assertThat(body.amount()).isEqualByComparingTo("123.45");

        // GET one
        ResponseEntity<ExpenseResponse> fetched = auth().get()
            .uri(BASE_URL + "/{id}", id)
            .retrieve()
            .toEntity(ExpenseResponse.class);
        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetched.getBody()).isNotNull();
        assertThat(fetched.getBody().id()).isEqualTo(id);

        // GET list
        ResponseEntity<String> listed = auth().get()
            .uri(BASE_URL)
            .retrieve()
            .toEntity(String.class);
        assertThat(listed.getStatusCode()).isEqualTo(HttpStatus.OK);

        // PUT → update
        UpdateExpenseRequest updateReq = new UpdateExpenseRequest(
            new BigDecimal("200.00"), ExpenseCategory.TRANSPORT, "Updated", LocalDate.of(2026, 5, 2));

        ResponseEntity<ExpenseResponse> updated = auth().put()
            .uri(BASE_URL + "/{id}", id)
            .contentType(MediaType.APPLICATION_JSON)
            .body(updateReq)
            .retrieve()
            .toEntity(ExpenseResponse.class);
        assertThat(updated.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(updated.getBody()).isNotNull();
        assertThat(updated.getBody().amount()).isEqualByComparingTo("200.00");
        assertThat(updated.getBody().category()).isEqualTo(ExpenseCategory.TRANSPORT);

        // DELETE
        ResponseEntity<Void> deleted = auth().delete()
            .uri(BASE_URL + "/{id}", id)
            .retrieve()
            .toBodilessEntity();
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        // GET after delete → 404
        ResponseEntity<String> afterDelete = auth().get()
            .uri(BASE_URL + "/{id}", id)
            .retrieve()
            .toEntity(String.class);
        assertThat(afterDelete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void summary_endpoint_e2e() {
        LocalDate may = LocalDate.of(2026, 5, 10);
        auth().post().uri(BASE_URL).contentType(MediaType.APPLICATION_JSON)
            .body(buildCreate(new BigDecimal("100.00"), ExpenseCategory.HOUSING, may))
            .retrieve().toBodilessEntity();
        auth().post().uri(BASE_URL).contentType(MediaType.APPLICATION_JSON)
            .body(buildCreate(new BigDecimal("50.00"), ExpenseCategory.HEALTH, may))
            .retrieve().toBodilessEntity();
        auth().post().uri(BASE_URL).contentType(MediaType.APPLICATION_JSON)
            .body(buildCreate(new BigDecimal("75.00"), ExpenseCategory.HOUSING, may))
            .retrieve().toBodilessEntity();

        ResponseEntity<ExpenseSummaryResponse> summary = auth().get()
            .uri(BASE_URL + "/summary?month=2026-05")
            .retrieve()
            .toEntity(ExpenseSummaryResponse.class);

        assertThat(summary.getStatusCode()).isEqualTo(HttpStatus.OK);
        ExpenseSummaryResponse resp = summary.getBody();
        assertThat(resp).isNotNull();
        assertThat(resp.month()).isEqualTo("2026-05");
        assertThat(resp.grandTotal()).isGreaterThanOrEqualTo(new BigDecimal("225.00"));
        assertThat(resp.totalCount()).isGreaterThanOrEqualTo(3);
        assertThat(resp.byCategory()).isNotEmpty();
    }

    @Test
    void unauthenticated_request_returns_401() {
        ResponseEntity<String> response = noAuth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(buildCreate(new BigDecimal("10.00"), ExpenseCategory.OTHER, LocalDate.of(2026, 5, 1)))
            .retrieve()
            .toEntity(String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void update_unknown_expense_returns_404() {
        UUID unknownId = UUID.randomUUID();
        UpdateExpenseRequest req = new UpdateExpenseRequest(
            new BigDecimal("10.00"), ExpenseCategory.OTHER, null, LocalDate.of(2026, 5, 1));

        ResponseEntity<String> resp = auth().put()
            .uri(BASE_URL + "/{id}", unknownId)
            .contentType(MediaType.APPLICATION_JSON)
            .body(req)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void delete_unknown_expense_returns_404() {
        UUID unknownId = UUID.randomUUID();

        ResponseEntity<String> resp = auth().delete()
            .uri(BASE_URL + "/{id}", unknownId)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void create_invalid_amount_returns_400() {
        ResponseEntity<String> resp = auth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(buildCreate(BigDecimal.ZERO, ExpenseCategory.OTHER, LocalDate.of(2026, 5, 1)))
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void summary_empty_month_returns_zeros() {
        ResponseEntity<ExpenseSummaryResponse> summary = auth().get()
            .uri(BASE_URL + "/summary?month=2020-01")
            .retrieve()
            .toEntity(ExpenseSummaryResponse.class);

        assertThat(summary.getStatusCode()).isEqualTo(HttpStatus.OK);
        ExpenseSummaryResponse resp = summary.getBody();
        assertThat(resp).isNotNull();
        assertThat(resp.month()).isEqualTo("2020-01");
        assertThat(resp.totalCount()).isEqualTo(0);
        assertThat(resp.byCategory()).isEmpty();
    }
}
