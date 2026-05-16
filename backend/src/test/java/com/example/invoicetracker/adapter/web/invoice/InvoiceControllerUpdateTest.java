package com.example.invoicetracker.adapter.web.invoice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.application.invoice.InvoiceService;
import com.example.invoicetracker.domain.invoice.InvoiceNotEditableException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.math.BigDecimal;
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
class InvoiceControllerUpdateTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    InvoiceService invoiceService;

    MockMvc mvc;

    private UUID invoiceId;
    private UUID clientId;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
        invoiceId = UUID.randomUUID();
        clientId = UUID.randomUUID();
    }

    @Test
    @WithMockUser
    void put_returns_200_happy_path() throws Exception {
        when(invoiceService.update(
            eq(invoiceId), any(), eq(clientId), any(), any(), anyList(), any(BigDecimal.class)))
            .thenReturn(InvoiceFixtures.invoice(invoiceId, clientId));

        mvc.perform(put("/api/v1/invoices/{id}", invoiceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-2026-0001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [{"description":"Widget","quantity":1,"unitPrice":"100.00"}]
                    }
                    """.formatted(clientId)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(invoiceId.toString()))
            .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    @Test
    @WithMockUser
    void put_returns_409_when_not_draft() throws Exception {
        when(invoiceService.update(
            eq(invoiceId), any(), eq(clientId), any(), any(), anyList(), any(BigDecimal.class)))
            .thenThrow(new InvoiceNotEditableException(invoiceId, InvoiceStatus.SENT));

        mvc.perform(put("/api/v1/invoices/{id}", invoiceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-2026-0001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [{"description":"Widget","quantity":1,"unitPrice":"100.00"}]
                    }
                    """.formatted(clientId)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_EDITABLE"));
    }

    @Test
    @WithMockUser
    void put_returns_404_when_invoice_not_found() throws Exception {
        when(invoiceService.update(
            eq(invoiceId), any(), eq(clientId), any(), any(), anyList(), any(BigDecimal.class)))
            .thenThrow(new InvoiceNotFoundException(invoiceId));

        mvc.perform(put("/api/v1/invoices/{id}", invoiceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-2026-0001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [{"description":"Widget","quantity":1,"unitPrice":"100.00"}]
                    }
                    """.formatted(clientId)))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("INVOICE_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void put_returns_400_when_lines_empty() throws Exception {
        mvc.perform(put("/api/v1/invoices/{id}", invoiceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-2026-0001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": []
                    }
                    """.formatted(clientId)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void put_returns_400_when_client_id_missing() throws Exception {
        mvc.perform(put("/api/v1/invoices/{id}", invoiceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-2026-0001",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [{"description":"Widget","quantity":1,"unitPrice":"100.00"}]
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void put_returns_401_when_unauthenticated() throws Exception {
        mvc.perform(put("/api/v1/invoices/{id}", invoiceId)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "number": "INV-2026-0001",
                      "clientId": "%s",
                      "issueDate": "2026-05-01",
                      "dueDate": "2026-06-01",
                      "taxRate": "0.21",
                      "lines": [{"description":"Widget","quantity":1,"unitPrice":"100.00"}]
                    }
                    """.formatted(clientId)))
            .andExpect(status().isUnauthorized());
    }
}
