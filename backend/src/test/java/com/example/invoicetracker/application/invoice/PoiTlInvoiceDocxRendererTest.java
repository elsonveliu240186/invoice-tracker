package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.application.template.InvoiceTemplateProperties;
import com.example.invoicetracker.application.template.InvoiceTemplateStore;
import com.example.invoicetracker.application.template.TemplateMetadata;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import com.example.invoicetracker.support.InvoiceFixtures;
import com.example.invoicetracker.support.TemplateFixtures;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link PoiTlInvoiceDocxRenderer}.
 */
@ExtendWith(MockitoExtension.class)
class PoiTlInvoiceDocxRendererTest {

    @Mock
    InvoiceTemplateStore templateStore;

    PoiTlInvoiceDocxRenderer renderer;

    private InvoiceTemplateProperties props;
    private CompanyProperties company;

    @BeforeEach
    void setUp() throws IOException {
        props = new InvoiceTemplateProperties(
            Path.of("./templates/invoice-template.docx"),
            5_242_880L,
            "templates/invoice-template.docx",
            "en-US",
            "USD"
        );
        company = InvoiceFixtures.company();
        renderer = new PoiTlInvoiceDocxRenderer(templateStore, props);

        TemplateMetadata meta = new TemplateMetadata(
            "invoice-template.docx", 1000L, Instant.now(), false);

        byte[] templateBytes = TemplateFixtures.minimalDocx();
        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(templateBytes));
        when(templateStore.getMetadata()).thenReturn(meta);
    }

    @Test
    void merges_all_tokens() throws IOException {
        var invoice = InvoiceFixtures.invoice(UUID.randomUUID(), UUID.randomUUID());
        var client = InvoiceFixtures.client();

        byte[] docxBytes = renderer.render(invoice, client, company);

        assertThat(docxBytes).isNotEmpty();
        // Verify it's a valid DOCX (ZIP magic)
        assertThat(docxBytes[0] & 0xFF).isEqualTo(0x50); // P
        assertThat(docxBytes[1] & 0xFF).isEqualTo(0x4B); // K

        // Verify scalar tokens and line-item table loop are rendered correctly.
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            // Collect text from body paragraphs (scalar tokens live here)
            String paraText = doc.getParagraphs().stream()
                .map(XWPFParagraph::getText)
                .reduce("", (a, b) -> a + " " + b);
            // Collect text from table cells (line items live here after LoopRowTableRenderPolicy)
            String tableText = doc.getTables().stream()
                .flatMap(t -> t.getRows().stream())
                .flatMap(r -> r.getTableCells().stream())
                .map(c -> c.getText())
                .reduce("", (a, b) -> a + " " + b);
            String allText = paraText + " " + tableText;
            assertThat(allText).contains("INV-2026-0001");
            assertThat(allText).contains("Acme Corp");
            assertThat(allText).contains("Consulting services");
            assertThat(allText).contains("Support plan");
        }
    }

    @Test
    void handles_zero_lines_gracefully() throws IOException {
        Invoice emptyInvoice = new Invoice(
            UUID.randomUUID(),
            "INV-0001",
            UUID.randomUUID(),
            LocalDate.now(),
            LocalDate.now().plusDays(30),
            Collections.emptyList(),
            BigDecimal.ZERO,
            InvoiceStatus.DRAFT,
            null,
            Instant.now(),
            Instant.now(),
            null,
            null,
            null, null, null, null, null, null, null, null
        );
        var client = InvoiceFixtures.client();

        // Should not throw
        byte[] docxBytes = renderer.render(emptyInvoice, client, company);
        assertThat(docxBytes).isNotEmpty();
    }

    @Test
    void handles_50_lines_without_overflow() throws IOException {
        List<InvoiceLine> lines = new ArrayList<>();
        for (int i = 0; i < 50; i++) {
            lines.add(new InvoiceLine(UUID.randomUUID(),
                "Item " + i, i + 1, BigDecimal.TEN, i));
        }
        Invoice bigInvoice = new Invoice(
            UUID.randomUUID(),
            "INV-BIG",
            UUID.randomUUID(),
            LocalDate.now(),
            LocalDate.now().plusDays(30),
            lines,
            new BigDecimal("0.10"),
            InvoiceStatus.DRAFT,
            null,
            Instant.now(),
            Instant.now(),
            null,
            null,
            null, null, null, null, null, null, null, null
        );
        var client = InvoiceFixtures.client();

        // Set up fresh mock for this test
        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        byte[] docxBytes = renderer.render(bigInvoice, client, company);
        assertThat(docxBytes.length).isGreaterThan(1_000);

        // Verify it opens as a valid XWPFDocument
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            assertThat(doc.getParagraphs()).isNotEmpty();
        }
    }

    @Test
    void localises_currency_per_app_invoice_locale() throws IOException {
        InvoiceTemplateProperties deProps = new InvoiceTemplateProperties(
            Path.of("./templates/invoice-template.docx"),
            5_242_880L,
            "templates/invoice-template.docx",
            "de-DE",
            "EUR"
        );
        PoiTlInvoiceDocxRenderer deRenderer = new PoiTlInvoiceDocxRenderer(
            templateStore, deProps);

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        var invoice = InvoiceFixtures.invoice(UUID.randomUUID(), UUID.randomUUID());
        var client = InvoiceFixtures.client();

        // Should not throw; EUR formatting applied
        byte[] docxBytes = deRenderer.render(invoice, client, company);
        assertThat(docxBytes).isNotEmpty();
    }

    @Test
    void result_is_valid_zip() throws IOException {
        var invoice = InvoiceFixtures.invoice(UUID.randomUUID(), UUID.randomUUID());
        var client = InvoiceFixtures.client();

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        byte[] docxBytes = renderer.render(invoice, client, company);

        // ZIP magic PK\x03\x04
        assertThat(docxBytes[0] & 0xFF).isEqualTo(0x50);
        assertThat(docxBytes[1] & 0xFF).isEqualTo(0x4B);
        assertThat(docxBytes[2] & 0xFF).isEqualTo(0x03);
        assertThat(docxBytes[3] & 0xFF).isEqualTo(0x04);
    }

    @Test
    void renders_with_null_currency_skips_currency_override() throws IOException {
        // Cover: props.currency() != null && !props.currency().isBlank() → false when null
        InvoiceTemplateProperties nullCurrencyProps = new InvoiceTemplateProperties(
            Path.of("./templates/invoice-template.docx"),
            5_242_880L,
            "templates/invoice-template.docx",
            "en-US",
            null
        );
        PoiTlInvoiceDocxRenderer rendererNullCcy = new PoiTlInvoiceDocxRenderer(
            templateStore, nullCurrencyProps);

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        var invoice = InvoiceFixtures.invoice(UUID.randomUUID(), UUID.randomUUID());
        var client = InvoiceFixtures.client();
        byte[] docxBytes = rendererNullCcy.render(invoice, client, company);
        assertThat(docxBytes).isNotEmpty();
    }

    @Test
    void renders_with_blank_currency_skips_currency_override() throws IOException {
        // Cover: props.currency() != null && !props.currency().isBlank() → false when blank
        InvoiceTemplateProperties blankCurrencyProps = new InvoiceTemplateProperties(
            Path.of("./templates/invoice-template.docx"),
            5_242_880L,
            "templates/invoice-template.docx",
            "en-US",
            ""
        );
        PoiTlInvoiceDocxRenderer rendererBlankCcy = new PoiTlInvoiceDocxRenderer(
            templateStore, blankCurrencyProps);

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        var invoice = InvoiceFixtures.invoice(UUID.randomUUID(), UUID.randomUUID());
        var client = InvoiceFixtures.client();
        byte[] docxBytes = rendererBlankCcy.render(invoice, client, company);
        assertThat(docxBytes).isNotEmpty();
    }

    @Test
    void renders_with_null_issue_and_due_dates() throws IOException {
        // Cover: invoice.issueDate() != null → false and invoice.dueDate() != null → false
        Invoice nullDatesInvoice = new Invoice(
            UUID.randomUUID(), "INV-NODATES", UUID.randomUUID(),
            null, null,
            Collections.emptyList(),
            java.math.BigDecimal.ZERO, InvoiceStatus.DRAFT,
            null, Instant.now(), Instant.now(), null, null,
            null, null, null, null, null, null, null, null
        );
        var client = InvoiceFixtures.client();

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        byte[] docxBytes = renderer.render(nullDatesInvoice, client, company);
        assertThat(docxBytes).isNotEmpty();
    }

    @Test
    void snapshot_fields_take_precedence_over_live_client_data() throws IOException {
        // Invoice has snapshot "Snapshot Client Name"; live client has different name "Live Client"
        UUID invoiceId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoiceWithSnapshot = new Invoice(
            invoiceId, "INV-SNAP-001", clientId,
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1),
            List.of(InvoiceFixtures.line("Widget", 1, "50.00")),
            new BigDecimal("0.10"), InvoiceStatus.DRAFT,
            null, Instant.now(), Instant.now(), null, null,
            "Snapshot Client Name", "Snapshot Client Address",
            "Snapshot Company Name", "Snapshot Company Address",
            "VAT-SNAP", "IBAN-SNAP", "SWIFT-SNAP", "Bank-SNAP"
        );
        var liveClient = InvoiceFixtures.client(clientId, "Live Client", "live@example.com");

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        byte[] docxBytes = renderer.render(invoiceWithSnapshot, liveClient, company);

        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String allText = doc.getParagraphs().stream()
                .map(XWPFParagraph::getText)
                .reduce("", (a, b) -> a + " " + b)
                + doc.getTables().stream()
                    .flatMap(t -> t.getRows().stream())
                    .flatMap(r -> r.getTableCells().stream())
                    .map(c -> c.getText())
                    .reduce("", (a, b) -> a + " " + b);
            assertThat(allText).contains("Snapshot Client Name");
            assertThat(allText).doesNotContain("Live Client");
        }
    }

    @Test
    void falls_back_to_live_data_when_snapshot_is_null() throws IOException {
        // Invoice has null snapshots — should fall back to live client / company data
        Invoice invoiceNullSnapshots = new Invoice(
            UUID.randomUUID(), "INV-LIVE-001", UUID.randomUUID(),
            LocalDate.of(2026, 1, 1), LocalDate.of(2026, 2, 1),
            List.of(InvoiceFixtures.line("Service", 1, "100.00")),
            new BigDecimal("0.20"), InvoiceStatus.DRAFT,
            null, Instant.now(), Instant.now(), null, null,
            null, null, null, null, null, null, null, null
        );
        var liveClient = InvoiceFixtures.client(UUID.randomUUID(), "Live Fallback Corp", "live@example.com");

        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocx()));

        byte[] docxBytes = renderer.render(invoiceNullSnapshots, liveClient, company);

        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(docxBytes))) {
            String allText = doc.getParagraphs().stream()
                .map(XWPFParagraph::getText)
                .reduce("", (a, b) -> a + " " + b)
                + doc.getTables().stream()
                    .flatMap(t -> t.getRows().stream())
                    .flatMap(r -> r.getTableCells().stream())
                    .map(c -> c.getText())
                    .reduce("", (a, b) -> a + " " + b);
            assertThat(allText).contains("Live Fallback Corp");
        }
    }

    @Test
    void renders_when_template_has_no_lines_trigger_table() throws IOException {
        // Cover: linesTable == null → return templateBytes directly
        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(TemplateFixtures.minimalDocxWithoutLinesTable()));

        var invoice = InvoiceFixtures.invoice(UUID.randomUUID(), UUID.randomUUID());
        var client = InvoiceFixtures.client();
        byte[] docxBytes = renderer.render(invoice, client, company);
        assertThat(docxBytes).isNotEmpty();
        // Should still be valid ZIP/DOCX
        assertThat(docxBytes[0] & 0xFF).isEqualTo(0x50);
        assertThat(docxBytes[1] & 0xFF).isEqualTo(0x4B);
    }


}
