package com.example.invoicetracker.application.invoice;

import com.deepoove.poi.XWPFTemplate;
import com.deepoove.poi.config.Configure;
import com.example.invoicetracker.application.template.InvoiceTemplateProperties;
import com.example.invoicetracker.application.template.InvoiceTemplateStore;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.Currency;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Default {@link InvoiceDocxRenderer} using poi-tl 1.12.2.
 *
 * <p>Populates {@code {{company.*}}}, {@code {{client.*}}}, {@code {{invoice.*}}}
 * scalar tokens. Line items are expanded manually via Apache POI before poi-tl runs,
 * which avoids the {@code XmlValueDisconnectedException} caused by poi-tl's
 * {@code LoopRowTableRenderPolicy} using xmlbeans {@code copy()} to clone rows.
 *
 * <p>Template table structure (two-row trigger):
 * <ul>
 *   <li>Row 0, cell 0: {@code {{lines}}} — marks this table for expansion
 *   <li>Row 1: {@code {{description}}}, {@code {{quantity}}}, {@code {{unitPrice}}},
 *       {@code {{lineTotal}}} — cloned per line then replaced with real text
 * </ul>
 * After expansion these two rows are removed and one row per {@link InvoiceLine} is
 * inserted in their place, properly rooted in the document XML store.
 */
@Component
public class PoiTlInvoiceDocxRenderer implements InvoiceDocxRenderer {

    private static final Logger log = LoggerFactory.getLogger(PoiTlInvoiceDocxRenderer.class);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final String LINES_TRIGGER = "{{lines}}";

    private final InvoiceTemplateStore templateStore;
    private final InvoiceTemplateProperties props;

    public PoiTlInvoiceDocxRenderer(
        InvoiceTemplateStore templateStore,
        InvoiceTemplateProperties props
    ) {
        this.templateStore = templateStore;
        this.props = props;
    }

    @Override
    public byte[] render(Invoice invoice, Client client, CompanyProperties company) {
        Locale locale = Locale.forLanguageTag(props.locale());
        NumberFormat currencyFmt = NumberFormat.getCurrencyInstance(locale);
        if (props.currency() != null && !props.currency().isBlank()) {
            currencyFmt.setCurrency(Currency.getInstance(props.currency()));
        }

        long start = System.currentTimeMillis();
        try (InputStream tplStream = templateStore.openTemplate()) {
            byte[] rawBytes = tplStream.readAllBytes();

            // Pre-expand the {{lines}} table using POI API (avoids poi-tl row-clone
            // XmlValueDisconnectedException — xmlbeans CTRow.copy() orphans child beans).
            byte[] expandedBytes = expandLinesTable(rawBytes, invoice, currencyFmt);

            Map<String, Object> model = buildModel(invoice, client, company, currencyFmt);
            Configure configure = Configure.builder().build();

            try (InputStream expanded = new ByteArrayInputStream(expandedBytes)) {
                XWPFTemplate template = XWPFTemplate.compile(expanded, configure);
                template.render(model);
                ByteArrayOutputStream out = new ByteArrayOutputStream();
                template.writeAndClose(out);
                long elapsed = System.currentTimeMillis() - start;
                log.info("DOCX rendered invoice={} templateIsDefault={} durationMs={}",
                    invoice.id(), templateStore.getMetadata().isDefault(), elapsed);
                return out.toByteArray();
            }
        } catch (IOException e) {
            throw new IllegalStateException("Failed to render invoice DOCX: " + invoice.id(), e);
        }
    }

    /**
     * Finds the table whose first cell contains {@code {{lines}}}, manually inserts one row
     * per invoice line using {@link XWPFTable#insertNewTableRow} (properly rooted in the
     * document XML store), then removes the trigger row and template row. Returns the
     * serialised bytes of the modified document, or the original bytes if no trigger table
     * is found.
     */
    private byte[] expandLinesTable(byte[] templateBytes, Invoice invoice,
            NumberFormat currencyFmt) throws IOException {
        try (XWPFDocument doc = new XWPFDocument(new ByteArrayInputStream(templateBytes))) {
            XWPFTable linesTable = null;
            for (XWPFTable table : doc.getTables()) {
                if (table.getNumberOfRows() >= 2
                        && LINES_TRIGGER.equals(table.getRow(0).getCell(0).getText())) {
                    linesTable = table;
                    break;
                }
            }
            if (linesTable == null) {
                return templateBytes;
            }

            List<InvoiceLine> lines =
                invoice.lines() != null ? invoice.lines() : Collections.emptyList();

            // Insert one properly-rooted row per line item after the template row (index 1).
            for (int i = 0; i < lines.size(); i++) {
                InvoiceLine line = lines.get(i);
                XWPFTableRow row = linesTable.insertNewTableRow(2 + i);
                while (row.getTableCells().size() < 4) {
                    row.addNewTableCell();
                }
                row.getCell(0).setText(nullSafe(line.description()));
                row.getCell(1).setText(String.valueOf(line.quantity()));
                row.getCell(2).setText(formatAmount(line.unitPrice(), currencyFmt));
                row.getCell(3).setText(formatAmount(line.lineTotal(), currencyFmt));
            }

            // Remove template row (index 1) then trigger row (index 0) — reverse order
            // so that removing row 1 does not shift row 0's index.
            linesTable.removeRow(1);
            linesTable.removeRow(0);

            ByteArrayOutputStream out = new ByteArrayOutputStream();
            doc.write(out);
            return out.toByteArray();
        }
    }

    private Map<String, Object> buildModel(
        Invoice invoice, Client client, CompanyProperties company, NumberFormat currencyFmt
    ) {
        // poi-tl resolves {{a.b}} as nested access: model.get("a") → object → .b property.
        // Use nested maps so {{company.name}}, {{invoice.number}} etc. resolve correctly.
        Map<String, Object> companyMap = new HashMap<>();
        companyMap.put("name", nullSafe(company.name()));
        companyMap.put("address", nullSafe(company.address()));
        companyMap.put("email", nullSafe(company.email()));
        companyMap.put("taxId", nullSafe(company.taxId()));

        Map<String, Object> clientMap = new HashMap<>();
        clientMap.put("name", nullSafe(client.name()));
        clientMap.put("email", nullSafe(client.email()));
        clientMap.put("address", nullSafe(client.address()));

        BigDecimal subtotal = invoice.subtotal().setScale(2, RoundingMode.HALF_EVEN);
        BigDecimal taxAmount = invoice.total().subtract(subtotal)
            .setScale(2, RoundingMode.HALF_EVEN);

        Map<String, Object> invoiceMap = new HashMap<>();
        invoiceMap.put("number", nullSafe(invoice.number()));
        invoiceMap.put("issueDate",
            invoice.issueDate() != null ? invoice.issueDate().format(DATE_FMT) : "");
        invoiceMap.put("dueDate",
            invoice.dueDate() != null ? invoice.dueDate().format(DATE_FMT) : "");
        invoiceMap.put("subtotal", formatAmount(subtotal, currencyFmt));
        invoiceMap.put("taxRate", formatTaxRate(invoice.taxRate()));
        invoiceMap.put("taxAmount", formatAmount(taxAmount, currencyFmt));
        invoiceMap.put("total", formatAmount(invoice.total(), currencyFmt));

        Map<String, Object> model = new HashMap<>();
        model.put("company", companyMap);
        model.put("client", clientMap);
        model.put("invoice", invoiceMap);
        return model;
    }

    private String nullSafe(String value) {
        return value != null ? value : "";
    }

    private String formatAmount(BigDecimal amount, NumberFormat fmt) {
        if (amount == null) {
            return "";
        }
        return fmt.format(amount.setScale(2, RoundingMode.HALF_EVEN));
    }

    private String formatTaxRate(BigDecimal taxRate) {
        if (taxRate == null) {
            return "0%";
        }
        BigDecimal pct = taxRate.multiply(BigDecimal.valueOf(100)).stripTrailingZeros();
        return pct.toPlainString() + "%";
    }
}
