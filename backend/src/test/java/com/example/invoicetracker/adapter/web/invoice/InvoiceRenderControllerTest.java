package com.example.invoicetracker.adapter.web.invoice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.application.invoice.InvoiceRenderService;
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import com.example.invoicetracker.domain.invoice.PdfConversionFailedException;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
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
class InvoiceRenderControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    InvoiceRenderService renderService;

    @MockitoBean
    InvoiceRepository invoiceRepository;

    MockMvc mvc;

    private UUID invoiceId;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();

        invoiceId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        var sampleInvoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId))
            .thenReturn(Optional.of(sampleInvoice));
    }

    @Test
    @WithMockUser
    void getDocx_returns_correct_media_type_and_disposition() throws Exception {
        byte[] docxBytes = new byte[]{0x50, 0x4B, 0x03, 0x04, 0x01};
        when(renderService.renderDocx(invoiceId)).thenReturn(docxBytes);

        mvc.perform(get("/api/v1/invoices/{id}/docx", invoiceId))
            .andExpect(status().isOk())
            .andExpect(content().contentType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .andExpect(header().string("Content-Disposition",
                "attachment; filename=\"invoice-INV-2026-0001.docx\""))
            .andExpect(header().string("Cache-Control", "private, no-store"));
    }

    @Test
    @WithMockUser
    void getDocxPdf_returns_correct_media_type_and_disposition() throws Exception {
        byte[] pdfBytes = "%PDF-1.4 fake".getBytes();
        when(renderService.renderPdf(invoiceId)).thenReturn(pdfBytes);

        mvc.perform(get("/api/v1/invoices/{id}/docx-pdf", invoiceId))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string("Content-Disposition",
                "inline; filename=\"invoice-INV-2026-0001.pdf\""))
            .andExpect(header().string("Cache-Control", "private, no-store"));
    }

    @Test
    @WithMockUser
    void getDocx_returns_404_for_unknown_id() throws Exception {
        UUID unknownId = UUID.randomUUID();
        when(renderService.renderDocx(unknownId))
            .thenThrow(new InvoiceNotFoundException(unknownId));
        when(invoiceRepository.findByIdWithLines(unknownId)).thenReturn(Optional.empty());

        mvc.perform(get("/api/v1/invoices/{id}/docx", unknownId))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void getDocxPdf_returns_502_on_conversion_failure() throws Exception {
        when(renderService.renderPdf(invoiceId))
            .thenThrow(new PdfConversionFailedException("LO crashed"));

        mvc.perform(get("/api/v1/invoices/{id}/docx-pdf", invoiceId))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.code").value("PDF_CONVERSION_FAILED"));
    }

    @Test
    @WithMockUser
    void sendDocxEmail_returns_200_with_lastSentAt() throws Exception {
        Instant sentAt = Instant.now();
        when(renderService.sendEmail(invoiceId)).thenReturn(sentAt);

        mvc.perform(post("/api/v1/invoices/{id}/docx-email", invoiceId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.lastSentAt").isNotEmpty());
    }

    @Test
    @WithMockUser
    void sendDocxEmail_returns_422_when_client_email_blank() throws Exception {
        when(renderService.sendEmail(invoiceId))
            .thenThrow(new InvoiceHasNoRecipientException(invoiceId));

        mvc.perform(post("/api/v1/invoices/{id}/docx-email", invoiceId))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.code").value("INVOICE_HAS_NO_RECIPIENT"));
    }

    @Test
    @WithMockUser
    void sendDocxEmail_returns_502_on_smtp_failure() throws Exception {
        when(renderService.sendEmail(invoiceId))
            .thenThrow(new EmailDeliveryFailedException(invoiceId.toString(),
                new RuntimeException("SMTP down")));

        mvc.perform(post("/api/v1/invoices/{id}/docx-email", invoiceId))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.code").value("EMAIL_DELIVERY_FAILED"));
    }

    @Test
    void requires_auth_returns_401() throws Exception {
        mvc.perform(get("/api/v1/invoices/{id}/docx", invoiceId))
            .andExpect(status().isUnauthorized());
    }
}
