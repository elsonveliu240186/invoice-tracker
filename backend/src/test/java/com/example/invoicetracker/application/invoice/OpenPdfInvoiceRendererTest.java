package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class OpenPdfInvoiceRendererTest {

    private OpenPdfInvoiceRenderer renderer;
    private CompanyProperties company;
    private Client client;

    @BeforeEach
    void setUp() {
        renderer = new OpenPdfInvoiceRenderer();
        // Inject the locale field
        ReflectionTestUtils.setField(renderer, "localeTag", "en-US");
        company = InvoiceFixtures.company();
        client = InvoiceFixtures.client(UUID.randomUUID(), "Test Client", "client@example.com");
    }

    @Test
    void bytes_start_with_pdf_magic() {
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());
        byte[] pdf = renderer.render(invoice, client, company);

        assertThat(pdf).hasSizeGreaterThan(1024);
        assertThat(new String(pdf, 0, 5)).isEqualTo("%PDF-");
    }

    @Test
    void contains_invoice_number_and_total() throws Exception {
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());
        byte[] pdf = renderer.render(invoice, client, company);

        String text = extractText(pdf);
        assertThat(text).contains("INV-2026-0001");
        assertThat(text).contains("Test Client");
        // Total = (200 + 50) * 1.21 = 302.50
        assertThat(text).contains("302.50");
    }

    @Test
    void contains_company_and_client_blocks() throws Exception {
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());
        byte[] pdf = renderer.render(invoice, client, company);

        String text = extractText(pdf);
        assertThat(text).contains("Acme Corp");
        assertThat(text).contains("client@example.com");
    }

    @Test
    void contains_line_items() throws Exception {
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());
        byte[] pdf = renderer.render(invoice, client, company);

        String text = extractText(pdf);
        assertThat(text).contains("Consulting services");
        assertThat(text).contains("Support plan");
    }

    @Test
    void handles_invoice_with_50_lines_without_overflow() throws Exception {
        UUID clientId = client.id();
        List<InvoiceLine> lines = new ArrayList<>();
        for (int i = 1; i <= 50; i++) {
            lines.add(new InvoiceLine(UUID.randomUUID(), "Line item " + i, 1,
                new BigDecimal("10.00"), i - 1));
        }
        Instant now = Instant.now();
        Invoice invoice = new Invoice(
            UUID.randomUUID(), "INV-MULTI", clientId,
            LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 1),
            lines, new BigDecimal("0.10"), InvoiceStatus.DRAFT, null, now, now, null, null);

        byte[] pdf = renderer.render(invoice, client, company);
        assertThat(pdf).hasSizeGreaterThan(1024);

        try (PDDocument doc = Loader.loadPDF(pdf)) {
            // Multi-page PDF should have at least 1 page
            assertThat(doc.getNumberOfPages()).isGreaterThanOrEqualTo(1);
        }

        String text = extractText(pdf);
        assertThat(text).contains("Line item 50");
    }

    @Test
    void localises_currency_per_app_invoice_locale() throws Exception {
        // Test en-US locale produces $ symbol
        ReflectionTestUtils.setField(renderer, "localeTag", "en-US");
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());
        byte[] pdf = renderer.render(invoice, client, company);
        String textUs = extractText(pdf);
        assertThat(textUs).contains("$");

        // Test with en-GB locale produces £ symbol
        ReflectionTestUtils.setField(renderer, "localeTag", "en-GB");
        byte[] pdfGb = renderer.render(invoice, client, company);
        String textGb = extractText(pdfGb);
        assertThat(textGb).contains("£");
    }

    @Test
    void handles_zero_tax_rate() throws Exception {
        UUID clientId = client.id();
        Instant now = Instant.now();
        List<InvoiceLine> lines = List.of(
            new InvoiceLine(UUID.randomUUID(), "No tax item", 1,
                new BigDecimal("100.00"), 0));
        Invoice invoice = new Invoice(
            UUID.randomUUID(), "INV-NOTAX", clientId,
            LocalDate.now(), LocalDate.now().plusDays(30),
            lines, BigDecimal.ZERO, InvoiceStatus.DRAFT, null, now, now, null, null);

        byte[] pdf = renderer.render(invoice, client, company);
        assertThat(pdf).hasSizeGreaterThan(1024);
        String text = extractText(pdf);
        // Should not show tax row; total == subtotal == 100
        assertThat(text).contains("100.00");
    }

    @Test
    void renders_with_null_optional_company_fields() throws Exception {
        // Cover the null-check branches for company address/email/taxId
        CompanyProperties minimalCompany = new CompanyProperties(
            "Minimal Corp", null, null, null);
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());

        byte[] pdf = renderer.render(invoice, client, minimalCompany);
        assertThat(pdf).hasSizeGreaterThan(1024);
        String text = extractText(pdf);
        assertThat(text).contains("Minimal Corp");
    }

    @Test
    void renders_with_empty_optional_company_fields() throws Exception {
        // Cover the isEmpty() branches for company address/email/taxId
        CompanyProperties emptyCompany = new CompanyProperties(
            "Empty Corp", "", "", "");
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), client.id());

        byte[] pdf = renderer.render(invoice, client, emptyCompany);
        assertThat(pdf).hasSizeGreaterThan(1024);
        String text = extractText(pdf);
        assertThat(text).contains("Empty Corp");
    }

    @Test
    void renders_with_null_client_email_and_address() throws Exception {
        // Cover the null-check branches for client email and address
        Client noDetailsClient = InvoiceFixtures.client(
            UUID.randomUUID(), "No Details Client", null);
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), noDetailsClient.id());

        byte[] pdf = renderer.render(invoice, noDetailsClient, company);
        assertThat(pdf).hasSizeGreaterThan(1024);
        String text = extractText(pdf);
        assertThat(text).contains("No Details Client");
    }

    @Test
    void renders_with_non_null_client_address() throws Exception {
        // Cover the true branch of client.address() != null check
        com.example.invoicetracker.domain.client.Client clientWithAddr =
            new com.example.invoicetracker.domain.client.Client(
                UUID.randomUUID(), "Addressed Client", "addr@example.com",
                null, "123 Client Street, NY", java.time.Instant.now(),
                java.time.Instant.now(), null);
        Invoice invoice = InvoiceFixtures.invoice(UUID.randomUUID(), clientWithAddr.id());

        byte[] pdf = renderer.render(invoice, clientWithAddr, company);
        assertThat(pdf).hasSizeGreaterThan(1024);
        String text = extractText(pdf);
        assertThat(text).contains("Addressed Client");
        assertThat(text).contains("123 Client Street");
    }

    private String extractText(byte[] pdfBytes) throws Exception {
        try (PDDocument doc = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            return stripper.getText(doc);
        }
    }
}
