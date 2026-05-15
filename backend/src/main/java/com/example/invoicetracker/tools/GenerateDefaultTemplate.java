package com.example.invoicetracker.tools;

import java.io.ByteArrayOutputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Generates the bundled default invoice DOCX template at
 * {@code src/main/resources/templates/invoice-template.docx}.
 *
 * <p>Uses the Apache POI API to create a properly structured OOXML document with
 * all required poi-tl tokens, including a two-row table for the
 * {@code LoopRowTableRenderPolicy} line-items loop.
 *
 * <p>Run once during development to regenerate the template:
 * <pre>
 *   mvn exec:java -Dexec.mainClass=com.example.invoicetracker.tools.GenerateDefaultTemplate
 * </pre>
 */
public final class GenerateDefaultTemplate {

    private static final Logger log = LoggerFactory.getLogger(GenerateDefaultTemplate.class);

    private GenerateDefaultTemplate() {}

    /**
     * Main method: generates the DOCX and writes it to the resources directory.
     *
     * @param args first arg optionally overrides the output path
     * @throws IOException if writing fails
     */
    public static void main(String[] args) throws IOException {
        String outputPath = args.length > 0 ? args[0]
            : "src/main/resources/templates/invoice-template.docx";
        Path out = Paths.get(outputPath);
        Files.createDirectories(out.getParent());

        byte[] docxBytes = generateTemplate();
        try (FileOutputStream fos = new FileOutputStream(out.toFile())) {
            fos.write(docxBytes);
        }
        log.info("Generated template at: {}", out.toAbsolutePath());
    }

    /**
     * Generates the DOCX bytes for the default invoice template using Apache POI API.
     *
     * <p>Produces a document with scalar poi-tl tokens as paragraphs and a two-row table
     * for {@code LoopRowTableRenderPolicy}: row 0 cell 0 = {@code {{lines}}},
     * row 1 cells 0-3 = {@code {{description}}}, {@code {{quantity}}},
     * {@code {{unitPrice}}}, {@code {{lineTotal}}}.
     *
     * @return DOCX bytes (valid OOXML ZIP) containing all required poi-tl tokens
     * @throws IOException if serialisation fails
     */
    public static byte[] generateTemplate() throws IOException {
        try (XWPFDocument doc = new XWPFDocument()) {
            // Header paragraphs
            addParagraph(doc, "INVOICE");
            addParagraph(doc, "");

            // Company block
            addParagraph(doc, "From: {{company.name}}");
            addParagraph(doc, "{{company.address}}");
            addParagraph(doc, "{{company.email}}");
            addParagraph(doc, "Tax ID: {{company.taxId}}");
            addParagraph(doc, "");

            // Client block
            addParagraph(doc, "Bill To: {{client.name}}");
            addParagraph(doc, "{{client.email}}");
            addParagraph(doc, "{{client.address}}");
            addParagraph(doc, "");

            // Invoice metadata
            addParagraph(doc, "Invoice Number: {{invoice.number}}");
            addParagraph(doc, "Issue Date: {{invoice.issueDate}}");
            addParagraph(doc, "Due Date: {{invoice.dueDate}}");
            addParagraph(doc, "");

            // Line-items table with LoopRowTableRenderPolicy structure:
            //   Row 0, cell 0: trigger token {{lines}}
            //   Row 1: template row cloned per line item by the policy
            XWPFTable table = doc.createTable(2, 4);
            table.getRow(0).getCell(0).setText("{{lines}}");
            table.getRow(0).getCell(1).setText("Qty");
            table.getRow(0).getCell(2).setText("Unit Price");
            table.getRow(0).getCell(3).setText("Total");
            table.getRow(1).getCell(0).setText("{{description}}");
            table.getRow(1).getCell(1).setText("{{quantity}}");
            table.getRow(1).getCell(2).setText("{{unitPrice}}");
            table.getRow(1).getCell(3).setText("{{lineTotal}}");

            // Totals block
            addParagraph(doc, "");
            addParagraph(doc, "Subtotal: {{invoice.subtotal}}");
            addParagraph(doc, "Tax ({{invoice.taxRate}}): {{invoice.taxAmount}}");
            addParagraph(doc, "TOTAL: {{invoice.total}}");
            addParagraph(doc, "");
            addParagraph(doc, "Thank you for your business.");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            doc.write(bos);
            return bos.toByteArray();
        }
    }

    private static void addParagraph(XWPFDocument doc, String text) {
        XWPFParagraph p = doc.createParagraph();
        XWPFRun run = p.createRun();
        run.setText(text);
    }
}
