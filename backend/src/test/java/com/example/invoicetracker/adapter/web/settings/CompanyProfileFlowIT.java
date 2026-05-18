package com.example.invoicetracker.adapter.web.settings;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceResponse;
import com.example.invoicetracker.adapter.web.settings.dto.CompanyProfileResponse;
import java.io.ByteArrayInputStream;
import java.util.UUID;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
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
import org.springframework.web.client.RestClient;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * End-to-end integration test: PUT company profile, then render DOCX, verify company name.
 */
@SpringBootTest(
    classes = Application.class,
    webEnvironment = WebEnvironment.RANDOM_PORT,
    properties = {
        "spring.security.user.name=user",
        "spring.security.user.password=password"
    }
)
@Testcontainers
class CompanyProfileFlowIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @LocalServerPort
    int port;

    private static final String USER = "user";
    private static final String PASS = "password";

    private RestClient auth;

    @BeforeEach
    void setUp() {
        auth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultHeaders(h -> h.setBasicAuth(USER, PASS))
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> {})
            .build();
    }

    @Test
    void get_company_profile_returns_200() {
        ResponseEntity<CompanyProfileResponse> resp = auth.get()
            .uri("/api/v1/settings/company")
            .retrieve()
            .toEntity(CompanyProfileResponse.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(resp.getBody()).isNotNull();
    }

    @Test
    void put_then_get_returns_updated_values() {
        String uniqueName = "Acme IT Corp " + UUID.randomUUID();

        ResponseEntity<CompanyProfileResponse> putResp = auth.put()
            .uri("/api/v1/settings/company")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {
                  "name": "%s",
                  "address": "456 IT Ave",
                  "phone": "+1 888-0000",
                  "email": "acme-it@example.com",
                  "vatNumber": "VATIT001",
                  "iban": "GB29NWBK60161331926819",
                  "swiftBic": "NWBKGB2L",
                  "bankName": "IT Bank"
                }
                """.formatted(uniqueName))
            .retrieve()
            .toEntity(CompanyProfileResponse.class);

        assertThat(putResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(putResp.getBody()).isNotNull();
        assertThat(putResp.getBody().name()).isEqualTo(uniqueName);

        ResponseEntity<CompanyProfileResponse> getResp = auth.get()
            .uri("/api/v1/settings/company")
            .retrieve()
            .toEntity(CompanyProfileResponse.class);

        assertThat(getResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResp.getBody()).isNotNull();
        assertThat(getResp.getBody().name()).isEqualTo(uniqueName);
    }

    @Test
    void put_then_render_docx_contains_value() throws Exception {
        // Set the company name to something unique
        String uniqueName = "DocxFlowCorp " + UUID.randomUUID().toString().substring(0, 8);

        auth.put()
            .uri("/api/v1/settings/company")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {
                  "name": "%s",
                  "address": "789 Docx Lane"
                }
                """.formatted(uniqueName))
            .retrieve()
            .toEntity(CompanyProfileResponse.class);

        // Create a client and invoice (fresh — no snapshots will override the resolver)
        String clientEmail = "docx-flow-" + UUID.randomUUID() + "@example.com";
        ResponseEntity<ClientResponse> clientResp = auth.post()
            .uri("/api/v1/clients")
            .contentType(MediaType.APPLICATION_JSON)
            .body(new CreateClientRequest("Flow Client", clientEmail,
                null, null, null, null, null, null, null, null))
            .retrieve()
            .toEntity(ClientResponse.class);
        assertThat(clientResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID clientId = clientResp.getBody().id();

        String invoiceNumber = "FLOW-DOCX-" + UUID.randomUUID().toString().substring(0, 8);
        ResponseEntity<InvoiceResponse> invoiceResp = auth.post()
            .uri("/api/v1/invoices")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {
                  "number": "%s",
                  "clientId": "%s",
                  "issueDate": "2026-05-01",
                  "dueDate": "2026-06-01",
                  "taxRate": "0.21",
                  "lines": [
                    {"description": "Test service", "quantity": 1, "unitPrice": "100.00"}
                  ]
                }
                """.formatted(invoiceNumber, clientId))
            .retrieve()
            .toEntity(InvoiceResponse.class);
        assertThat(invoiceResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        UUID invoiceId = invoiceResp.getBody().id();

        // Download the DOCX
        ResponseEntity<byte[]> docxResp = auth.get()
            .uri("/api/v1/invoices/{id}/docx", invoiceId)
            .retrieve()
            .toEntity(byte[].class);
        assertThat(docxResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        byte[] docxBytes = docxResp.getBody();
        assertThat(docxBytes).isNotNull().isNotEmpty();

        // Extract text from the DOCX and verify company name is present
        StringBuilder docxText = new StringBuilder();
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            doc.getParagraphs().forEach(p -> docxText.append(p.getText()).append(" "));
            doc.getTables().forEach(t -> t.getRows().forEach(
                r -> r.getTableCells().forEach(
                    c -> docxText.append(c.getText()).append(" "))));
        }
        // The company name placeholder {{companyName}} should have been replaced
        // with uniqueName by the resolver (since the invoice has blank snapshots).
        assertThat(docxText.toString()).contains(uniqueName);
    }

    @Test
    void put_returns_400_when_name_blank() {
        ResponseEntity<String> resp = auth.put()
            .uri("/api/v1/settings/company")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {"name": "", "email": "valid@example.com"}
                """)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void put_returns_401_when_unauthenticated() {
        RestClient noAuth = RestClient.builder()
            .baseUrl("http://localhost:" + port)
            .defaultStatusHandler(HttpStatusCode::isError, (req, resp) -> {})
            .build();

        ResponseEntity<String> resp = noAuth.put()
            .uri("/api/v1/settings/company")
            .contentType(MediaType.APPLICATION_JSON)
            .body("""
                {"name": "Corp"}
                """)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}
