package com.example.invoicetracker.adapter.web.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
import com.example.invoicetracker.adapter.web.invoice.dto.GeneratedArtifactResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceArtifactsMetadataResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceResponse;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.io.TempDir;
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
class InvoiceArtifactControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @TempDir
    static Path tempArtifactDir;

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) throws IOException {
        Files.createDirectories(tempArtifactDir);
        registry.add("app.invoice.generated.path", tempArtifactDir::toString);
        String loBin = System.getenv("LIBREOFFICE_BIN_TEST");
        if (loBin != null && !loBin.isBlank()) {
            registry.add("app.libreoffice.binary", () -> loBin);
        }
    }

    @LocalServerPort
    int port;

    private RestClient auth;
    private RestClient noAuth;

    @BeforeEach
    void setUp() {
        auth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultHeaders(h -> h.setBasicAuth("user", "password"))
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> {})
            .build();
        noAuth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> {})
            .build();
    }

    // ===== metadata endpoint (no rendering required) =====

    @Test
    void metadata_returns_200_with_both_null_before_generate() {
        UUID clientId = createClient("Meta Client", "meta-" + UUID.randomUUID() + "@example.com");
        UUID invoiceId = createInvoice(clientId, "INV-META-" + UUID.randomUUID());

        ResponseEntity<InvoiceArtifactsMetadataResponse> resp = auth.get()
            .uri("/api/v1/invoices/{id}/generated/metadata", invoiceId)
            .retrieve()
            .toEntity(InvoiceArtifactsMetadataResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        InvoiceArtifactsMetadataResponse body = resp.getBody();
        assertThat(body).isNotNull();
        assertThat(body.pdf()).isNull();
        assertThat(body.docx()).isNull();
    }

    @Test
    void metadata_returns_404_for_unknown_invoice() {
        ResponseEntity<String> resp = auth.get()
            .uri("/api/v1/invoices/{id}/generated/metadata", UUID.randomUUID())
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void metadata_returns_401_without_credentials() {
        UUID clientId = createClient("Auth Client", "auth-" + UUID.randomUUID() + "@example.com");
        UUID invoiceId = createInvoice(clientId, "INV-AUTH-" + UUID.randomUUID());

        ResponseEntity<String> resp = noAuth.get()
            .uri("/api/v1/invoices/{id}/generated/metadata", invoiceId)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ===== generated endpoint 404 (no rendering required) =====

    @Test
    void streamGenerated_returns_404_when_not_generated() {
        UUID clientId = createClient("DL Client", "dl-" + UUID.randomUUID() + "@example.com");
        UUID invoiceId = createInvoice(clientId, "INV-DL-" + UUID.randomUUID());

        ResponseEntity<String> resp = auth.get()
            .uri("/api/v1/invoices/{id}/generated?format=PDF", invoiceId)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void streamGenerated_returns_401_without_credentials() {
        ResponseEntity<String> resp = noAuth.get()
            .uri("/api/v1/invoices/{id}/generated", UUID.randomUUID())
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void previewPdf_returns_401_without_credentials() {
        ResponseEntity<String> resp = noAuth.get()
            .uri("/api/v1/invoices/{id}/preview-pdf", UUID.randomUUID())
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    void generate_returns_401_without_credentials() {
        ResponseEntity<String> resp = noAuth.post()
            .uri("/api/v1/invoices/{id}/generate", UUID.randomUUID())
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    // ===== full lifecycle — requires LibreOffice =====

    @Test
    @EnabledIfEnvironmentVariable(named = "LIBREOFFICE_BIN_TEST", matches = ".+")
    void full_lifecycle_pdf_generate_download_regenerate() {
        UUID clientId = createClient("LO Client", "lo-" + UUID.randomUUID() + "@example.com");
        UUID invoiceId = createInvoice(clientId, "INV-LO-" + UUID.randomUUID());

        // generate PDF
        ResponseEntity<GeneratedArtifactResponse> genResp = auth.post()
            .uri("/api/v1/invoices/{id}/generate?format=PDF", invoiceId)
            .retrieve()
            .toEntity(GeneratedArtifactResponse.class);
        assertThat(genResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        GeneratedArtifactResponse gen = genResp.getBody();
        assertThat(gen).isNotNull();
        assertThat(gen.format()).isEqualTo("PDF");
        assertThat(gen.sizeBytes()).isGreaterThan(0);
        String firstSha = gen.sha256();

        // metadata shows pdf present
        ResponseEntity<InvoiceArtifactsMetadataResponse> meta = auth.get()
            .uri("/api/v1/invoices/{id}/generated/metadata", invoiceId)
            .retrieve()
            .toEntity(InvoiceArtifactsMetadataResponse.class);
        assertThat(meta.getBody().pdf()).isNotNull();
        assertThat(meta.getBody().docx()).isNull();

        // download returns valid PDF
        ResponseEntity<byte[]> dl = auth.get()
            .uri("/api/v1/invoices/{id}/generated?format=PDF", invoiceId)
            .retrieve()
            .toEntity(byte[].class);
        assertThat(dl.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(dl.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        byte[] pdfBytes = dl.getBody();
        assertThat(pdfBytes).isNotNull();
        assertThat(new String(pdfBytes, 0, 4)).isEqualTo("%PDF");

        // second generate without overwrite → 409
        ResponseEntity<String> conflict = auth.post()
            .uri("/api/v1/invoices/{id}/generate?format=PDF&overwrite=false", invoiceId)
            .retrieve()
            .toEntity(String.class);
        assertThat(conflict.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

        // regenerate with overwrite=true succeeds and sha256 may differ (new generation)
        ResponseEntity<GeneratedArtifactResponse> regen = auth.post()
            .uri("/api/v1/invoices/{id}/generate?format=PDF&overwrite=true", invoiceId)
            .retrieve()
            .toEntity(GeneratedArtifactResponse.class);
        assertThat(regen.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(regen.getBody().sizeBytes()).isGreaterThan(0);
    }

    // ===== helpers =====

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
              "taxRate": "0.21",
              "lines": [
                {"description": "Consulting", "quantity": 2, "unitPrice": "100.00"}
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
}
