package com.example.invoicetracker.adapter.web.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
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
class ClientControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @LocalServerPort
    int port;

    private static final String BASE_URL = "/api/v1/clients";
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

    private CreateClientRequest buildRequest(String name, String email) {
        return new CreateClientRequest(name, email, null, null);
    }

    @Test
    void create_then_get_then_delete_round_trip() {
        String email = "itcorp-" + UUID.randomUUID() + "@example.com";

        ResponseEntity<ClientResponse> created = auth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(buildRequest("IT Corp", email))
            .retrieve()
            .toEntity(ClientResponse.class);

        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getHeaders().getLocation()).isNotNull();
        ClientResponse body = created.getBody();
        assertThat(body).isNotNull();
        assertThat(body.id()).isNotNull();
        assertThat(body.name()).isEqualTo("IT Corp");

        UUID id = body.id();

        ResponseEntity<ClientResponse> fetched = auth().get().uri(BASE_URL + "/{id}", id)
            .retrieve()
            .toEntity(ClientResponse.class);
        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetched.getBody()).isNotNull();
        assertThat(fetched.getBody().id()).isEqualTo(id);

        ResponseEntity<Void> deleted = auth().delete().uri(BASE_URL + "/{id}", id)
            .retrieve()
            .toBodilessEntity();
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> afterDelete = auth().get().uri(BASE_URL + "/{id}", id)
            .retrieve()
            .toEntity(String.class);
        assertThat(afterDelete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void duplicate_email_returns_409() {
        String email = "dup-it-" + UUID.randomUUID() + "@example.com";

        auth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(buildRequest("First Client", email))
            .retrieve()
            .toBodilessEntity();

        ResponseEntity<String> second = auth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(buildRequest("Second Client", email))
            .retrieve()
            .toEntity(String.class);

        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unauthenticated_request_returns_401() {
        ResponseEntity<String> response = noAuth().post().uri(BASE_URL)
            .contentType(MediaType.APPLICATION_JSON)
            .body(buildRequest("X", "x@example.com"))
            .retrieve()
            .toEntity(String.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
