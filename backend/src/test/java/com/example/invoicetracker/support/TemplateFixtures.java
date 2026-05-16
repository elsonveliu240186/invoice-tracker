package com.example.invoicetracker.support;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.HashSet;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFRun;
import org.apache.poi.xwpf.usermodel.XWPFTable;

/**
 * Builds minimal but valid DOCX byte arrays for use in template and renderer tests.
 *
 * <p>Uses the Apache POI API to create properly rooted CTDocument XML bean objects,
 * ensuring poi-tl's LoopRowTableRenderPolicy can clone rows without
 * XmlValueDisconnectedException.
 */
public final class TemplateFixtures {

    private TemplateFixtures() {}

    /**
     * Returns a minimal valid DOCX with poi-tl tokens as plain-text paragraphs and a
     * two-row table containing the {@code {{lines}}} loop trigger (row 0) and per-line
     * template tokens (row 1), compatible with {@code LoopRowTableRenderPolicy}.
     *
     * <p>Uses the Apache POI API so that all CTRImpl XML beans are rooted in CTDocument —
     * this prevents XmlValueDisconnectedException when poi-tl clones table rows.
     *
     * @return DOCX bytes containing scalar tokens and the table-row loop
     * @throws IOException if serialisation fails
     */
    public static byte[] minimalDocx() throws IOException {
        try (XWPFDocument doc = new XWPFDocument()) {
            // Scalar token paragraphs
            String[] tokens = {
                "Invoice #{{invoice.number}}",
                "Client: {{client.name}}",
                "Company: {{company.name}}",
                "Address: {{company.address}}",
                "Email: {{company.email}}",
                "Tax ID: {{company.taxId}}",
                "Client Email: {{client.email}}",
                "Client Address: {{client.address}}",
                "Issue Date: {{invoice.issueDate}}",
                "Due Date: {{invoice.dueDate}}",
                "Subtotal: {{invoice.subtotal}}",
                "Tax Rate: {{invoice.taxRate}}",
                "Tax Amount: {{invoice.taxAmount}}",
                "Total: {{invoice.total}}"
            };
            for (String token : tokens) {
                XWPFParagraph p = doc.createParagraph();
                XWPFRun run = p.createRun();
                run.setText(token);
            }

            // Two-row table for LoopRowTableRenderPolicy:
            //   Row 0, cell 0: trigger {{lines}}
            //   Row 1: template row cloned per line item
            XWPFTable table = doc.createTable(2, 4);
            table.getRow(0).getCell(0).setText("{{lines}}");
            table.getRow(0).getCell(1).setText("");
            table.getRow(0).getCell(2).setText("");
            table.getRow(0).getCell(3).setText("");
            table.getRow(1).getCell(0).setText("{{description}}");
            table.getRow(1).getCell(1).setText("{{quantity}}");
            table.getRow(1).getCell(2).setText("{{unitPrice}}");
            table.getRow(1).getCell(3).setText("{{lineTotal}}");

            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            doc.write(bos);
            return bos.toByteArray();
        }
    }

    /**
     * Returns a DOCX where the ZIP has no {@code word/document.xml} entry.
     * Used to test magic-byte pass but ZIP-entry fail.
     *
     * @return bytes of a ZIP with only a dummy entry
     * @throws IOException if ZIP serialisation fails
     */
    public static byte[] invalidDocxMissingWordDocument() throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipOutputStream zos = new ZipOutputStream(out)) {
            ZipEntry entry = new ZipEntry("[Content_Types].xml");
            zos.putNextEntry(entry);
            zos.write("<dummy/>".getBytes());
            zos.closeEntry();
        }
        return out.toByteArray();
    }

    /**
     * Returns a DOCX with an external HTTP relationship reference.
     * Used to verify SSRF scanning in FilesystemInvoiceTemplateStore.
     *
     * @return valid DOCX ZIP bytes with an external relationship
     * @throws IOException if construction fails
     */
    public static byte[] docxWithExternalRelationship() throws IOException {
        // Build a real docx first then inject an external rels entry.
        // Skip any existing word/_rels/document.xml.rels to avoid duplicate-entry errors.
        byte[] realDocx = minimalDocx();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipInputStream zin =
                 new ZipInputStream(
                     new ByteArrayInputStream(realDocx));
             ZipOutputStream zout = new ZipOutputStream(out)) {

            ZipEntry entry;
            Set<String> written = new HashSet<>();
            while ((entry = zin.getNextEntry()) != null) {
                String name = entry.getName();
                // Skip the existing rels entry — we will replace it with the evil one.
                // Also skip any duplicates to avoid ZipException.
                if ("word/_rels/document.xml.rels".equals(name) || written.contains(name)) {
                    zin.closeEntry();
                    continue;
                }
                written.add(name);
                ZipEntry newEntry = new ZipEntry(name);
                zout.putNextEntry(newEntry);
                zout.write(zin.readAllBytes());
                zout.closeEntry();
            }
            // Add evil rels entry
            ZipEntry relsEntry = new ZipEntry("word/_rels/document.xml.rels");
            zout.putNextEntry(relsEntry);
            String evilRels = "<?xml version=\"1.0\"?><Relationships"
                + " xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
                + "<Relationship Id=\"rId99\""
                + " Type=\"http://schemas.openxmlformats.org/\""
                + " Target=\"http://evil.example.com/payload\" TargetMode=\"External\"/>"
                + "</Relationships>";
            zout.write(evilRels.getBytes());
            zout.closeEntry();
        }
        return out.toByteArray();
    }

    /**
     * Returns a minimal valid DOCX that contains NO {@code {{lines}}} trigger table.
     * Used to verify the {@code linesTable == null} branch in
     * {@code PoiTlInvoiceDocxRenderer.expandLinesTable}.
     *
     * @return DOCX bytes with scalar tokens but no lines table
     * @throws IOException if serialisation fails
     */
    public static byte[] minimalDocxWithoutLinesTable() throws IOException {
        try (XWPFDocument doc = new XWPFDocument()) {
            XWPFParagraph p = doc.createParagraph();
            XWPFRun run = p.createRun();
            run.setText("Invoice #{{invoice.number}}");
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            doc.write(bos);
            return bos.toByteArray();
        }
    }

    /**
     * Returns a valid DOCX that contains a {@code word/vbaProject.bin} entry,
     * simulating a macro-infected template.
     *
     * @return DOCX bytes with a VBA project entry
     * @throws IOException if construction fails
     */
    public static byte[] docxWithVbaMacros() throws IOException {
        byte[] realDocx = minimalDocx();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ZipInputStream zin = new ZipInputStream(new ByteArrayInputStream(realDocx));
             ZipOutputStream zout = new ZipOutputStream(out)) {
            ZipEntry entry;
            Set<String> written = new HashSet<>();
            while ((entry = zin.getNextEntry()) != null) {
                String name = entry.getName();
                if (written.contains(name)) {
                    zin.closeEntry();
                    continue;
                }
                written.add(name);
                zout.putNextEntry(new ZipEntry(name));
                zout.write(zin.readAllBytes());
                zout.closeEntry();
            }
            // Inject the VBA project binary entry
            zout.putNextEntry(new ZipEntry("word/vbaProject.bin"));
            zout.write(new byte[]{(byte) 0xD0, (byte) 0xCF, 0x11, (byte) 0xE0}); // OLE2 magic
            zout.closeEntry();
        }
        return out.toByteArray();
    }

    /**
     * Returns raw bytes that are NOT a ZIP (plain text).
     *
     * @return non-DOCX bytes
     */
    public static byte[] notADocx() {
        return "This is not a DOCX file".getBytes();
    }
}
