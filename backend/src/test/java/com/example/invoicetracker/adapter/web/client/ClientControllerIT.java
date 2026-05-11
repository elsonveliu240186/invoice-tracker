package com.example.invoicetracker.adapter.web.client;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
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

    @Autowired
    TestRestTemplate restTemplate;

    private static final String BASE_URL = "/api/v1/clients";
    private static final String USER = "user";
    private static final String PASS = "password";

    private TestRestTemplate authTemplate() {
        return restTemplate.withBasicAuth(USER, PASS);
    }

    private CreateClientRequest buildRequest(String name, String email) {
        return new CreateClientRequest(name, email, null, null);
    }

    @Test
    void create_then_get_then_delete_round_trip() {
        CreateClientRequest req = buildRequest("IT Corp", "itcorp-" + UUID.randomUUID() + "@example.com");

        ResponseEntity<ClientResponse> created = authTemplate()
            .postForEntity(BASE_URL, req, ClientResponse.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(created.getHeaders().getLocation()).isNotNull();
        ClientResponse body = created.getBody();
        assertThat(body).isNotNull();
        assertThat(body.id()).isNotNull();
        assertThat(body.name()).isEqualTo("IT Corp");

        UUID id = body.id();
        ResponseEntity<ClientResponse> fetched = authTemplate()
            .getForEntity(BASE_URL + "/" + id, ClientResponse.class);
        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetched.getBody()).isNotNull();
        assertThat(fetched.getBody().id()).isEqualTo(id);

        ResponseEntity<Void> deleted = authTemplate()
            .exchange(BASE_URL + "/" + id, HttpMethod.DELETE, null, Void.class);
        assertThat(deleted.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<String> afterDelete = authTemplate()
            .getForEntity(BASE_URL + "/" + id, String.class);
        assertThat(afterDelete.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void duplicate_email_returns_409() {
        String email = "dup-it-" + UUID.randomUUID() + "@example.com";
        CreateClientRequest req = buildRequest("First Client", email);
        authTemplate().postForEntity(BASE_URL, req, ClientResponse.class);

        ResponseEntity<String> second = authTemplate()
            .postForEntity(BASE_URL, buildRequest("Second Client", email), String.class);
        assertThat(second.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }

    @Test
    void unauthenticated_request_returns_401() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(
            "{\"name\":\"X\",\"email\":\"x@example.com\"}", headers);

        ResponseEntity<String> response = restTemplate
            .exchange(BASE_URL, HttpMethod.POST, entity, String.class);
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
