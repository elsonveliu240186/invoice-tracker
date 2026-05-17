package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.format.DateTimeFormatter;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Default PDF renderer implementation using OpenPDF 2.0.
 * Builds a print-ready A4 invoice document.
 */
@Component
public class OpenPdfInvoiceRenderer implements InvoicePdfRenderer {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd MMM yyyy");
    private static final float MARGIN = 36f;

    @Value("${app.invoice.locale:en-US}")
    private String localeTag;

    @Override
    public byte[] render(Invoice invoice, Client client, CompanyProperties company) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, MARGIN, MARGIN, MARGIN, MARGIN);
        try {
            PdfWriter.getInstance(document, out);
            document.open();

            Locale locale = Locale.forLanguageTag(localeTag);
            NumberFormat currencyFmt = NumberFormat.getCurrencyInstance(locale);

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 20);
            Font headerFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font normalFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font smallFont = FontFactory.getFont(FontFactory.HELVETICA, 8);

            // Title
            Paragraph title = new Paragraph("INVOICE", titleFont);
            title.setAlignment(Element.ALIGN_RIGHT);
            title.setSpacingAfter(4f);
            document.add(title);

            // Invoice number and dates
            Paragraph invoiceNum = new Paragraph("Invoice #" + invoice.number(), headerFont);
            invoiceNum.setAlignment(Element.ALIGN_RIGHT);
            document.add(invoiceNum);

            Paragraph issueDatePara = new Paragraph(
                "Issue Date: " + invoice.issueDate().format(DATE_FMT), normalFont);
            issueDatePara.setAlignment(Element.ALIGN_RIGHT);
            document.add(issueDatePara);

            Paragraph dueDatePara = new Paragraph(
                "Due Date: " + invoice.dueDate().format(DATE_FMT), normalFont);
            dueDatePara.setAlignment(Element.ALIGN_RIGHT);
            dueDatePara.setSpacingAfter(20f);
            document.add(dueDatePara);

            // Two-column block: company + client
            PdfPTable headerTable = new PdfPTable(2);
            headerTable.setWidthPercentage(100);
            headerTable.setSpacingAfter(20f);

            // Company block
            PdfPCell companyCell = new PdfPCell();
            companyCell.setBorder(PdfPCell.NO_BORDER);
            companyCell.addElement(new Paragraph("FROM", headerFont));
            companyCell.addElement(new Paragraph(company.name(), normalFont));
            if (!company.address().isEmpty()) {
                companyCell.addElement(new Paragraph(company.address(), normalFont));
            }
            if (!company.email().isEmpty()) {
                companyCell.addElement(new Paragraph(company.email(), normalFont));
            }
            if (!company.taxId().isEmpty()) {
                companyCell.addElement(new Paragraph("Tax ID: " + company.taxId(), smallFont));
            }
            headerTable.addCell(companyCell);

            // Client block
            PdfPCell clientCell = new PdfPCell();
            clientCell.setBorder(PdfPCell.NO_BORDER);
            clientCell.addElement(new Paragraph("BILL TO", headerFont));
            clientCell.addElement(new Paragraph(client.name(), normalFont));
            if (client.email() != null && !client.email().isBlank()) {
                clientCell.addElement(new Paragraph(client.email(), normalFont));
            }
            if (client.address() != null && !client.address().isBlank()) {
                clientCell.addElement(new Paragraph(client.address(), normalFont));
            }
            headerTable.addCell(clientCell);

            document.add(headerTable);

            // Line-items table
            PdfPTable linesTable = new PdfPTable(4);
            linesTable.setWidthPercentage(100);
            linesTable.setWidths(new float[]{6f, 1.5f, 2f, 2f});
            linesTable.setSpacingAfter(10f);

            addTableHeader(linesTable, headerFont,
                "Description", "Qty", "Unit Price", "Total");

            for (InvoiceLine line : invoice.lines()) {
                addCell(linesTable, line.description(), normalFont, Element.ALIGN_LEFT);
                addCell(linesTable, String.valueOf(line.quantity()), normalFont, Element.ALIGN_CENTER);
                addCell(linesTable, formatMoney(line.unitPrice(), currencyFmt),
                    normalFont, Element.ALIGN_RIGHT);
                addCell(linesTable, formatMoney(line.lineTotal(), currencyFmt),
                    normalFont, Element.ALIGN_RIGHT);
            }

            document.add(linesTable);

            // Totals
            PdfPTable totalsTable = new PdfPTable(2);
            totalsTable.setWidthPercentage(40);
            totalsTable.setHorizontalAlignment(Element.ALIGN_RIGHT);
            totalsTable.setSpacingAfter(30f);

            BigDecimal subtotal = invoice.subtotal();
            addTotalsRow(totalsTable, "Subtotal:", formatMoney(subtotal, currencyFmt),
                normalFont, false);

            if (invoice.taxRate().compareTo(BigDecimal.ZERO) != 0) {
                BigDecimal taxAmt = invoice.total().subtract(subtotal);
                String taxLabel = "Tax ("
                    + invoice.taxRate().multiply(BigDecimal.valueOf(100)).stripTrailingZeros()
                        .toPlainString()
                    + "%):";
                addTotalsRow(totalsTable, taxLabel, formatMoney(taxAmt, currencyFmt),
                    normalFont, false);
            }

            addTotalsRow(totalsTable, "TOTAL:", formatMoney(invoice.total(), currencyFmt),
                headerFont, true);

            document.add(totalsTable);

            // Footer
            Paragraph footer = new Paragraph(
                "Thank you for your business — issued " + invoice.issueDate().format(DATE_FMT),
                smallFont);
            footer.setAlignment(Element.ALIGN_CENTER);
            document.add(footer);

        } catch (DocumentException e) {
            throw new IllegalStateException("Failed to render invoice PDF", e);
        } finally {
            document.close();
        }
        return out.toByteArray();
    }

    private void addTableHeader(PdfPTable table, Font font, String... headers) {
        for (String header : headers) {
            PdfPCell cell = new PdfPCell(new Phrase(header, font));
            cell.setBackgroundColor(new Color(220, 220, 220));
            cell.setPadding(6f);
            cell.setHorizontalAlignment(Element.ALIGN_CENTER);
            table.addCell(cell);
        }
    }

    private void addCell(PdfPTable table, String text, Font font, int alignment) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(5f);
        cell.setHorizontalAlignment(alignment);
        table.addCell(cell);
    }

    private void addTotalsRow(PdfPTable table, String label, String value,
                              Font font, boolean bold) {
        Font usedFont = bold ? FontFactory.getFont(FontFactory.HELVETICA_BOLD, font.getSize()) : font;
        PdfPCell labelCell = new PdfPCell(new Phrase(label, usedFont));
        labelCell.setBorder(bold ? PdfPCell.TOP : PdfPCell.NO_BORDER);
        labelCell.setPadding(4f);
        labelCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(labelCell);

        PdfPCell valueCell = new PdfPCell(new Phrase(value, usedFont));
        valueCell.setBorder(bold ? PdfPCell.TOP : PdfPCell.NO_BORDER);
        valueCell.setPadding(4f);
        valueCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        table.addCell(valueCell);
    }

    private String formatMoney(BigDecimal amount, NumberFormat fmt) {
        return fmt.format(amount);
    }
}
