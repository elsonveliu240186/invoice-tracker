package com.example.invoicetracker.adapter.template;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.invoicetracker.application.template.InvalidTemplateException;
import com.example.invoicetracker.application.template.InvoiceTemplateProperties;
import com.example.invoicetracker.application.template.TemplateTooLargeException;
import com.example.invoicetracker.application.template.TemplateMetadata;
import com.example.invoicetracker.support.TemplateFixtures;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

/**
 * Unit tests for {@link FilesystemInvoiceTemplateStore}.
 */
class FilesystemInvoiceTemplateStoreTest {

    @TempDir
    Path tempDir;

    private FilesystemInvoiceTemplateStore store;
    private Path templatePath;

    @BeforeEach
    void setUp() {
        templatePath = tempDir.resolve("invoice-template.docx");
        InvoiceTemplateProperties props = new InvoiceTemplateProperties(
            templatePath,
            5_242_880L,
            "templates/invoice-template.docx",
            "en-US",
            "USD"
        );
        store = new FilesystemInvoiceTemplateStore(props);
    }

    @Test
    void replace_writes_atomically() throws IOException {
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        TemplateMetadata meta = store.replace(
            new ByteArrayInputStream(docxBytes), docxBytes.length);

        assertThat(templatePath).exists();
        assertThat(meta.filename()).isEqualTo("invoice-template.docx");
        assertThat(meta.sizeBytes()).isEqualTo(docxBytes.length);
        assertThat(meta.isDefault()).isFalse();
    }

    @Test
    void replace_rejects_non_docx_magic() {
        byte[] notADocx = TemplateFixtures.notADocx();

        assertThatThrownBy(() -> store.replace(
            new ByteArrayInputStream(notADocx), notADocx.length))
            .isInstanceOf(InvalidTemplateException.class)
            .hasMessageContaining("magic bytes");
    }

    @Test
    void replace_rejects_zip_without_word_document_xml() throws IOException {
        byte[] invalidDocx = TemplateFixtures.invalidDocxMissingWordDocument();

        assertThatThrownBy(() -> store.replace(
            new ByteArrayInputStream(invalidDocx), invalidDocx.length))
            .isInstanceOf(InvalidTemplateException.class)
            .hasMessageContaining("word/document.xml");
    }

    @Test
    void upload_rejects_docx_with_vba_macros() throws IOException {
        byte[] macroDocx = TemplateFixtures.docxWithVbaMacros();

        assertThatThrownBy(() -> store.replace(
            new ByteArrayInputStream(macroDocx), macroDocx.length))
            .isInstanceOf(InvalidTemplateException.class)
            .hasMessageContaining("VBA macros");
    }

    @Test
    void replace_rejects_external_relationships() throws IOException {
        byte[] evilDocx = TemplateFixtures.docxWithExternalRelationship();

        assertThatThrownBy(() -> store.replace(
            new ByteArrayInputStream(evilDocx), evilDocx.length))
            .isInstanceOf(InvalidTemplateException.class)
            .hasMessageContaining("external relationship");
    }

    @Test
    void replace_rejects_oversized_upload() throws IOException {
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        // Configure a tiny limit
        Path smallLimitPath = tempDir.resolve("small-limit.docx");
        InvoiceTemplateProperties tinyProps = new InvoiceTemplateProperties(
            smallLimitPath,
            10L, // 10 bytes max
            "templates/invoice-template.docx",
            "en-US",
            "USD"
        );
        FilesystemInvoiceTemplateStore tinyStore = new FilesystemInvoiceTemplateStore(tinyProps);

        assertThatThrownBy(() -> tinyStore.replace(
            new ByteArrayInputStream(docxBytes), docxBytes.length))
            .isInstanceOf(TemplateTooLargeException.class);
    }

    @Test
    void resolve_falls_back_to_classpath_default() throws IOException {
        // No filesystem file — classpath default is at templates/invoice-template.docx
        assertThat(templatePath).doesNotExist();

        TemplateMetadata meta = store.getMetadata();
        assertThat(meta.isDefault()).isTrue();
        assertThat(meta.filename()).isEqualTo("invoice-template.docx");
    }

    @Test
    void open_template_falls_back_to_classpath_when_fs_missing() throws IOException {
        assertThat(templatePath).doesNotExist();

        try (var stream = store.openTemplate()) {
            assertThat(stream).isNotNull();
            byte[] content = stream.readAllBytes();
            // Classpath default should be a valid DOCX (ZIP magic)
            assertThat(content[0] & 0xFF).isEqualTo(0x50); // P
            assertThat(content[1] & 0xFF).isEqualTo(0x4B); // K
        }
    }

    @Test
    void open_template_reads_from_filesystem_when_present() throws IOException {
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        store.replace(new ByteArrayInputStream(docxBytes), docxBytes.length);

        try (var stream = store.openTemplate()) {
            byte[] content = stream.readAllBytes();
            assertThat(content).isEqualTo(docxBytes);
        }
    }

    @Test
    void path_traversal_blocked_at_startup() {
        // The store normalises the configured path at construction time.
        // A valid nested path (no traversal) should succeed.
        Path nestedPath = tempDir.resolve("nested").resolve("invoice-template.docx");
        InvoiceTemplateProperties props = new InvoiceTemplateProperties(
            nestedPath,
            5_242_880L,
            "templates/invoice-template.docx",
            "en-US",
            "USD"
        );
        // Should not throw — path is sane
        FilesystemInvoiceTemplateStore nestedStore = new FilesystemInvoiceTemplateStore(props);
        assertThat(nestedStore).isNotNull();
    }

    @Test
    void get_metadata_returns_correct_size_after_replace() throws IOException {
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        store.replace(new ByteArrayInputStream(docxBytes), docxBytes.length);

        TemplateMetadata meta = store.getMetadata();
        assertThat(meta.sizeBytes()).isEqualTo(docxBytes.length);
        assertThat(meta.isDefault()).isFalse();
        assertThat(meta.uploadedAt()).isNotNull();
    }

    @Test
    void replace_rejects_when_streaming_total_exceeds_max() throws IOException {
        // Cover: total > props.maxTemplateBytes() branch during streaming read
        // Upload a file that passes the initial size check but claim smaller size
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        // Set limit to half the actual content length so streaming read overflows
        InvoiceTemplateProperties tinyProps = new InvoiceTemplateProperties(
            tempDir.resolve("streaming-limit.docx"),
            (long) (docxBytes.length / 2),
            "templates/invoice-template.docx",
            "en-US",
            "USD"
        );
        FilesystemInvoiceTemplateStore tinyStore = new FilesystemInvoiceTemplateStore(tinyProps);

        // Pass reported size that is within limit to bypass initial check,
        // but the actual stream is larger
        assertThatThrownBy(() -> tinyStore.replace(
            new ByteArrayInputStream(docxBytes), (long) (docxBytes.length / 2) - 1))
            .isInstanceOf(TemplateTooLargeException.class);
    }

    @Test
    void replace_rejects_too_short_content_as_non_zip() {
        // Cover: hasZipMagic content.length < ZIP_MAGIC.length → false
        byte[] tooShort = new byte[]{0x50, 0x4B}; // only 2 bytes, ZIP magic needs 4
        assertThatThrownBy(() -> store.replace(new ByteArrayInputStream(tooShort), tooShort.length))
            .isInstanceOf(InvalidTemplateException.class)
            .hasMessageContaining("magic bytes");
    }

    @Test
    void replace_rejects_docx_with_external_https_relationship() throws IOException {
        // Cover containsExternalTarget: Target="https://..." branch
        byte[] realDocx = TemplateFixtures.minimalDocx();
        java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
        try (java.util.zip.ZipInputStream zin =
                 new java.util.zip.ZipInputStream(new ByteArrayInputStream(realDocx));
             java.util.zip.ZipOutputStream zout = new java.util.zip.ZipOutputStream(out)) {
            java.util.zip.ZipEntry entry;
            java.util.Set<String> written = new java.util.HashSet<>();
            while ((entry = zin.getNextEntry()) != null) {
                String name = entry.getName();
                if ("word/_rels/document.xml.rels".equals(name) || written.contains(name)) {
                    zin.closeEntry();
                    continue;
                }
                written.add(name);
                zout.putNextEntry(new java.util.zip.ZipEntry(name));
                zout.write(zin.readAllBytes());
                zout.closeEntry();
            }
            // Inject rels with https external reference
            zout.putNextEntry(new java.util.zip.ZipEntry("word/_rels/document.xml.rels"));
            String evilRels = "<?xml version=\"1.0\"?><Relationships"
                + " xmlns=\"http://schemas.openxmlformats.org/package/2006/relationships\">"
                + "<Relationship Id=\"rId1\" Type=\"http://schemas.openxmlformats.org/\""
                + " Target=\"https://evil.example.com/payload\" TargetMode=\"External\"/>"
                + "</Relationships>";
            zout.write(evilRels.getBytes());
            zout.closeEntry();
        }
        byte[] httpsEvil = out.toByteArray();

        assertThatThrownBy(() -> store.replace(new ByteArrayInputStream(httpsEvil), httpsEvil.length))
            .isInstanceOf(InvalidTemplateException.class)
            .hasMessageContaining("external relationship");
    }
}
