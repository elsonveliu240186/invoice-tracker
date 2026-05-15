package com.example.invoicetracker.adapter.web.invoice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.application.invoice.InvoiceService;
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK, classes = Application.class)
@Testcontainers
class InvoiceControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    InvoiceService invoiceService;

    MockMvc mvc;

    private UUID invoiceId;
    private Invoice sampleInvoice;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();

        invoiceId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        sampleInvoice = InvoiceFixtures.invoice(invoiceId, clientId);
    }

    @Test
    @WithMockUser
    void create_returns_201_with_location() throws Exception {
        when(invoiceService.create(
            eq("INV-001"), any(UUID.class), any(), any(), anyList(), any(BigDecimal.class)))
            .thenReturn(sampleInvoice);

        mvc.perform(post("/api/v1/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [
                        {"description": "Widget", "quantity": 1, "unitPrice": "100.00"}
                      ]
                    }
                    """.formatted(UUID.randomUUID())))
            .andExpect(status().isCreated())
            .andExpect(header().exists("Location"))
            .andExpect(jsonPath("$.number").value("INV-2026-0001"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_number_blank() throws Exception {
        mvc.perform(post("/api/v1/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [{"description": "Widget", "quantity": 1, "unitPrice": "10.00"}]
                    }
                    """.formatted(UUID.randomUUID())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_lines_empty() throws Exception {
        mvc.perform(post("/api/v1/invoices")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": []
                    }
                    """.formatted(UUID.randomUUID())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void get_returns_200() throws Exception {
        when(invoiceService.get(invoiceId)).thenReturn(sampleInvoice);

        mvc.perform(get("/api/v1/invoices/{id}", invoiceId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(invoiceId.toString()));
    }

    @Test
    @WithMockUser
    void get_returns_404_for_unknown_id() throws Exception {
        UUID id = UUID.randomUUID();
        when(invoiceService.get(id)).thenThrow(new InvoiceNotFoundException(id));

        mvc.perform(get("/api/v1/invoices/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void list_returns_page_envelope() throws Exception {
        when(invoiceService.list(any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(sampleInvoice)));

        mvc.perform(get("/api/v1/invoices"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithMockUser
    void getPdf_returns_application_pdf() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 sample".getBytes();
        when(invoiceService.renderPdf(invoiceId)).thenReturn(pdfBytes);
        when(invoiceService.get(invoiceId)).thenReturn(sampleInvoice);

        mvc.perform(get("/api/v1/invoices/{id}/pdf", invoiceId))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string("Content-Disposition",
                "inline; filename=\"invoice-INV-2026-0001.pdf\""))
            .andExpect(header().string("Cache-Control", "private, no-store"));
    }

    @Test
    @WithMockUser
    void getPdf_returns_404_for_unknown_id() throws Exception {
        UUID id = UUID.randomUUID();
        when(invoiceService.renderPdf(id)).thenThrow(new InvoiceNotFoundException(id));

        mvc.perform(get("/api/v1/invoices/{id}/pdf", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void sendEmail_returns_200_with_lastSentAt() throws Exception {
        Instant sentAt = Instant.now();
        Invoice sentInvoice = new Invoice(
            sampleInvoice.id(), sampleInvoice.number(), sampleInvoice.clientId(),
            sampleInvoice.issueDate(), sampleInvoice.dueDate(), sampleInvoice.lines(),
            sampleInvoice.taxRate(), InvoiceStatus.SENT, sentAt, sampleInvoice.createdAt(),
            sampleInvoice.updatedAt(), null, null);
        when(invoiceService.sendEmail(invoiceId)).thenReturn(sentInvoice);

        mvc.perform(post("/api/v1/invoices/{id}/send-email", invoiceId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lastSentAt").isNotEmpty());
    }

    @Test
    @WithMockUser
    void sendEmail_returns_502_on_delivery_failure() throws Exception {
        when(invoiceService.sendEmail(invoiceId))
            .thenThrow(new EmailDeliveryFailedException(invoiceId.toString(),
                new RuntimeException("SMTP down")));

        mvc.perform(post("/api/v1/invoices/{id}/send-email", invoiceId))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.code").value("EMAIL_DELIVERY_FAILED"));
    }

    @Test
    @WithMockUser
    void sendEmail_returns_422_when_no_recipient() throws Exception {
        when(invoiceService.sendEmail(invoiceId))
            .thenThrow(new InvoiceHasNoRecipientException(invoiceId));

        mvc.perform(post("/api/v1/invoices/{id}/send-email", invoiceId))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("INVOICE_HAS_NO_RECIPIENT"));
    }

    @Test
    @WithMockUser
    void markPaid_returns_200_with_paid_status() throws Exception {
        Invoice paidInvoice = new Invoice(
            sampleInvoice.id(), sampleInvoice.number(), sampleInvoice.clientId(),
            sampleInvoice.issueDate(), sampleInvoice.dueDate(), sampleInvoice.lines(),
            sampleInvoice.taxRate(), InvoiceStatus.PAID, null, sampleInvoice.createdAt(),
            sampleInvoice.updatedAt(), null, null);
        when(invoiceService.markAsPaid(invoiceId)).thenReturn(paidInvoice);

        mvc.perform(patch("/api/v1/invoices/{id}/mark-paid", invoiceId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("PAID"))
            .andExpect(jsonPath("$.id").value(invoiceId.toString()));
    }

    @Test
    @WithMockUser
    void markPaid_returns_404_for_unknown_id() throws Exception {
        UUID id = UUID.randomUUID();
        when(invoiceService.markAsPaid(id)).thenThrow(new InvoiceNotFoundException(id));

        mvc.perform(patch("/api/v1/invoices/{id}/mark-paid", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void delete_returns_204_on_success() throws Exception {
        mvc.perform(delete("/api/v1/invoices/{id}", invoiceId))
            .andExpect(status().isNoContent());

        org.mockito.Mockito.verify(invoiceService).deleteInvoice(invoiceId);
    }

    @Test
    @WithMockUser
    void delete_returns_404_for_unknown_id() throws Exception {
        UUID id = UUID.randomUUID();
        org.mockito.Mockito.doThrow(new InvoiceNotFoundException(id))
            .when(invoiceService).deleteInvoice(id);

        mvc.perform(delete("/api/v1/invoices/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_FOUND"));
    }

    @Test
    void delete_returns_401_without_auth() throws Exception {
        mvc.perform(delete("/api/v1/invoices/{id}", invoiceId))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void requires_auth_returns_401() throws Exception {
        mvc.perform(get("/api/v1/invoices"))
            .andExpect(status().isUnauthorized());
    }
}
