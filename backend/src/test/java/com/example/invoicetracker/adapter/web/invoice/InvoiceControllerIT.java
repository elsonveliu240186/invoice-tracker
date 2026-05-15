package com.example.invoicetracker.adapter.web.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
import com.example.invoicetracker.adapter.web.invoice.dto.InvoiceResponse;
import com.example.invoicetracker.adapter.web.invoice.dto.SendEmailResponse;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.internet.MimeMessage;
import jakarta.mail.internet.MimeMultipart;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.api.extension.RegisterExtension;
import com.example.invoicetracker.Application;
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
class InvoiceControllerIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP);

    @DynamicPropertySource
    static void dynamicProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.mail.host", () -> "127.0.0.1");
        // ServerSetupTest.SMTP port is a constant (3025) — safe to read before GreenMail starts
        registry.add("spring.mail.port", () -> ServerSetupTest.SMTP.getPort());
        registry.add("spring.mail.properties.mail.smtp.auth", () -> "false");
        registry.add("spring.mail.properties.mail.smtp.starttls.enable", () -> "false");
        registry.add("app.mail.from", () -> "no-reply@test.local");
        registry.add("app.mail.subject-template", () -> "Invoice #{{number}} from {{company}}");
        // Wire the real LibreOffice binary when available (used by LibreOffice-gated tests)
        String loBin = System.getenv("LIBREOFFICE_BIN_TEST");
        if (loBin != null && !loBin.isBlank()) {
            registry.add("app.libreoffice.binary", () -> loBin);
        }
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
              "taxRate": "0.21",
              "lines": [
                {"description": "Consulting", "quantity": 2, "unitPrice": "100.00"},
                {"description": "Support", "quantity": 1, "unitPrice": "50.00"}
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
    @EnabledIfEnvironmentVariable(named = "LIBREOFFICE_BIN_TEST", matches = ".+")
    void full_round_trip() throws Exception {
        String uniqueEmail = "it-client-" + UUID.randomUUID() + "@example.com";
        UUID clientId = createClient("IT Client", uniqueEmail);
        UUID invoiceId = createInvoice(clientId, "INV-IT-RT-" + UUID.randomUUID());

        // GET invoice
        ResponseEntity<InvoiceResponse> fetched = auth.get()
            .uri("/api/v1/invoices/{id}", invoiceId)
            .retrieve()
            .toEntity(InvoiceResponse.class);
        assertThat(fetched.getStatusCode()).isEqualTo(HttpStatus.OK);
        InvoiceResponse invoice = fetched.getBody();
        assertThat(invoice).isNotNull();
        assertThat(invoice.lines()).hasSize(2);
        assertThat(invoice.lastSentAt()).isNull();

        // GET PDF
        ResponseEntity<byte[]> pdfResponse = auth.get()
            .uri("/api/v1/invoices/{id}/pdf", invoiceId)
            .retrieve()
            .toEntity(byte[].class);
        assertThat(pdfResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(pdfResponse.getHeaders().getContentType()).isEqualTo(MediaType.APPLICATION_PDF);
        byte[] pdfBytes = pdfResponse.getBody();
        assertThat(pdfBytes).isNotNull();
        assertThat(pdfBytes.length).isGreaterThan(1024);
        assertThat(new String(pdfBytes, 0, 5)).isEqualTo("%PDF-");

        // POST send-email
        ResponseEntity<SendEmailResponse> sendResp = auth.post()
            .uri("/api/v1/invoices/{id}/send-email", invoiceId)
            .retrieve()
            .toEntity(SendEmailResponse.class);
        assertThat(sendResp.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(sendResp.getBody()).isNotNull();
        assertThat(sendResp.getBody().lastSentAt()).isNotNull();

        // Assert GreenMail received the email with PDF attachment
        MimeMessage[] received = greenMail.getReceivedMessages();
        assertThat(received).isNotEmpty();
        MimeMessage msg = received[received.length - 1];
        assertThat(msg.getAllRecipients()[0].toString()).isEqualTo(uniqueEmail);

        MimeMultipart mp = (MimeMultipart) msg.getContent();
        boolean hasPdfAttachment = false;
        for (int i = 0; i < mp.getCount(); i++) {
            String ct = mp.getBodyPart(i).getContentType();
            String disp = mp.getBodyPart(i).getDisposition();
            if (ct != null && ct.startsWith("application/pdf")
                && "attachment".equalsIgnoreCase(disp)) {
                hasPdfAttachment = true;
                assertThat(mp.getBodyPart(i).getFileName()).endsWith(".pdf");
            }
        }
        assertThat(hasPdfAttachment).as("Email should have PDF attachment").isTrue();

        // GET invoice again - lastSentAt should be set
        ResponseEntity<InvoiceResponse> afterSend = auth.get()
            .uri("/api/v1/invoices/{id}", invoiceId)
            .retrieve()
            .toEntity(InvoiceResponse.class);
        assertThat(afterSend.getBody()).isNotNull();
        assertThat(afterSend.getBody().lastSentAt()).isNotNull();
    }

    @Test
    void send_email_returns_404_for_unknown_invoice() {
        UUID unknown = UUID.randomUUID();
        ResponseEntity<String> resp = auth.post()
            .uri("/api/v1/invoices/{id}/send-email", unknown)
            .retrieve()
            .toEntity(String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void get_pdf_returns_404_for_unknown_invoice() {
        UUID unknown = UUID.randomUUID();
        ResponseEntity<String> resp = auth.get()
            .uri("/api/v1/invoices/{id}/pdf", unknown)
            .retrieve()
            .toEntity(String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void unauthenticated_request_returns_401() {
        ResponseEntity<String> resp = noAuth.get()
            .uri("/api/v1/invoices")
            .retrieve()
            .toEntity(String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }

    @Test
    @EnabledIfEnvironmentVariable(named = "LIBREOFFICE_BIN_TEST", matches = ".+")
    void send_email_when_smtp_down_returns_502() {
        String uniqueEmail = "it-smtp-down-" + UUID.randomUUID() + "@example.com";
        UUID clientId = createClient("SMTP Down Client", uniqueEmail);
        UUID invoiceId = createInvoice(clientId, "INV-SMTP-DOWN-" + UUID.randomUUID());

        // Bring down the SMTP server
        greenMail.stop();

        ResponseEntity<String> resp = auth.post()
            .uri("/api/v1/invoices/{id}/send-email", invoiceId)
            .retrieve()
            .toEntity(String.class);

        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.BAD_GATEWAY);
        assertThat(resp.getBody()).contains("EMAIL_DELIVERY_FAILED");
    }

    @Test
    void duplicate_invoice_number_returns_409() {
        String uniqueEmail = "it-dup-" + UUID.randomUUID() + "@example.com";
        UUID clientId = createClient("Dup Client", uniqueEmail);
        String number = "INV-DUP-" + UUID.randomUUID();
        createInvoice(clientId, number);

        // Second invoice with same number should fail
        String body = """
            {
              "number": "%s",
              "clientId": "%s",
              "issueDate": "2026-05-01",
              "dueDate": "2026-06-01",
              "taxRate": "0.00",
              "lines": [{"description": "Item", "quantity": 1, "unitPrice": "10.00"}]
            }
            """.formatted(number, clientId);

        ResponseEntity<String> resp = auth.post()
            .uri("/api/v1/invoices")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toEntity(String.class);
        assertThat(resp.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
