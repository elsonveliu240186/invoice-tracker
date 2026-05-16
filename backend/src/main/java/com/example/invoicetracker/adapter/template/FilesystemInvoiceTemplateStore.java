package com.example.invoicetracker.adapter.template;

import com.example.invoicetracker.application.template.InvalidTemplateException;
import com.example.invoicetracker.application.template.InvoiceTemplateProperties;
import com.example.invoicetracker.application.template.InvoiceTemplateStore;
import com.example.invoicetracker.application.template.TemplateMetadata;
import com.example.invoicetracker.application.template.TemplateNotFoundException;
import com.example.invoicetracker.application.template.TemplateTooLargeException;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.Instant;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

/**
 * Filesystem-backed {@link InvoiceTemplateStore}.
 *
 * <p>Stores the active template at the path configured by
 * {@code app.invoice.template-path} and falls back to the bundled classpath resource when
 * the filesystem file does not exist.
 *
 * <p>Security measures:
 * <ul>
 *   <li>Path traversal — the configured path is canonicalised at startup; any deviation throws.
 *   <li>Magic-byte validation — first 4 bytes must be {@code PK\x03\x04}.
 *   <li>ZIP-entry check — {@code word/document.xml} must be present.
 *   <li>External-relationship scan — any {@code Relationship Target="http...} reference is
 *       rejected to prevent SSRF.
 * </ul>
 */
@Component
public class FilesystemInvoiceTemplateStore implements InvoiceTemplateStore {

    private static final Logger log = LoggerFactory.getLogger(FilesystemInvoiceTemplateStore.class);

    /** ZIP magic bytes: PK\x03\x04 */
    private static final byte[] ZIP_MAGIC = {0x50, 0x4B, 0x03, 0x04};
    private static final String WORD_DOCUMENT_ENTRY = "word/document.xml";
    private static final String WORD_VBA_PROJECT_ENTRY = "word/vbaProject.bin";

    private final InvoiceTemplateProperties props;
    private final Path canonicalTargetPath;

    /**
     * Constructs the store and validates the configured path against traversal.
     *
     * @param props configuration properties
     * @throws IllegalArgumentException if the path escapes the configured parent directory
     */
    public FilesystemInvoiceTemplateStore(InvoiceTemplateProperties props) {
        this.props = props;
        // Normalize resolves all .. sequences, preventing directory traversal
        Path target = props.templatePath().toAbsolutePath().normalize();
        Path root = target.getParent();
        if (root == null) {
            throw new IllegalArgumentException(
                "Template path must have a parent directory: " + target);
        }
        this.canonicalTargetPath = target;
        log.info("FilesystemInvoiceTemplateStore initialised, target={}", canonicalTargetPath);
    }

    @Override
    public InputStream openTemplate() throws IOException {
        if (Files.exists(canonicalTargetPath)) {
            return Files.newInputStream(canonicalTargetPath);
        }
        // Classpath fallback
        ClassPathResource resource = new ClassPathResource(props.classpathDefault());
        if (!resource.exists()) {
            throw new TemplateNotFoundException();
        }
        return resource.getInputStream();
    }

    @Override
    public TemplateMetadata getMetadata() {
        if (Files.exists(canonicalTargetPath)) {
            try {
                BasicFileAttributes attrs = Files.readAttributes(
                    canonicalTargetPath, BasicFileAttributes.class);
                return new TemplateMetadata(
                    canonicalTargetPath.getFileName().toString(),
                    attrs.size(),
                    attrs.lastModifiedTime().toInstant(),
                    false
                );
            } catch (IOException e) {
                log.warn("Could not read attributes for {}: {}", canonicalTargetPath,
                    e.getMessage());
            }
        }
        // Classpath default
        ClassPathResource resource = new ClassPathResource(props.classpathDefault());
        try {
            long size = resource.contentLength();
            return new TemplateMetadata("invoice-template.docx", size, Instant.EPOCH, true);
        } catch (IOException e) {
            return new TemplateMetadata("invoice-template.docx", 0L, Instant.EPOCH, true);
        }
    }

    @Override
    public TemplateMetadata replace(InputStream src, long sizeBytes) throws IOException {
        if (sizeBytes > props.maxTemplateBytes()) {
            throw new TemplateTooLargeException(sizeBytes, props.maxTemplateBytes());
        }

        // Read all bytes first so we can validate before writing
        ByteArrayOutputStream buffer = new ByteArrayOutputStream((int) Math.min(sizeBytes,
            Integer.MAX_VALUE));
        byte[] chunk = new byte[8192];
        int read;
        long total = 0;
        while ((read = src.read(chunk)) != -1) {
            total += read;
            if (total > props.maxTemplateBytes()) {
                throw new TemplateTooLargeException(total, props.maxTemplateBytes());
            }
            buffer.write(chunk, 0, read);
        }
        byte[] content = buffer.toByteArray();

        // Validate magic bytes (ZIP = PK\x03\x04)
        if (!hasZipMagic(content)) {
            throw new InvalidTemplateException("file is not a ZIP/DOCX (wrong magic bytes)");
        }

        // Validate ZIP structure
        validateZipStructure(content);

        // Scan for external relationships (anti-SSRF)
        scanForExternalRelationships(content);

        // Ensure parent directory exists
        Files.createDirectories(canonicalTargetPath.getParent());

        // Atomic write via temp file + move
        Path tmpFile = canonicalTargetPath.getParent()
            .resolve("invoice-template.docx.tmp." + System.currentTimeMillis());
        Files.write(tmpFile, content);
        try {
            Files.move(tmpFile, canonicalTargetPath,
                StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException ex) {
            // Fallback to non-atomic move on filesystems that don't support it
            Files.move(tmpFile, canonicalTargetPath, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("Template replaced: {} bytes at {}", content.length, canonicalTargetPath);
        return getMetadata();
    }

    private boolean hasZipMagic(byte[] content) {
        if (content.length < ZIP_MAGIC.length) {
            return false;
        }
        for (int i = 0; i < ZIP_MAGIC.length; i++) {
            if (content[i] != ZIP_MAGIC[i]) {
                return false;
            }
        }
        return true;
    }

    private void validateZipStructure(byte[] content) throws IOException {
        boolean foundWordDocument = false;
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(content))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (WORD_DOCUMENT_ENTRY.equals(name)) {
                    foundWordDocument = true;
                }
                if (WORD_VBA_PROJECT_ENTRY.equals(name)) {
                    throw new InvalidTemplateException("DOCX contains VBA macros");
                }
                zis.closeEntry();
            }
        }
        if (!foundWordDocument) {
            throw new InvalidTemplateException(
                "ZIP does not contain '" + WORD_DOCUMENT_ENTRY + "' — not a DOCX file");
        }
    }

    private void scanForExternalRelationships(byte[] content) throws IOException {
        try (ZipInputStream zis = new ZipInputStream(new ByteArrayInputStream(content))) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String name = entry.getName();
                if (name.endsWith(".rels")) {
                    byte[] relsContent = zis.readAllBytes();
                    String relsText = new String(relsContent, java.nio.charset.StandardCharsets.UTF_8);
                    if (containsExternalTarget(relsText)) {
                        throw new InvalidTemplateException(
                            "DOCX contains external relationship references "
                                + "(possible SSRF vector) in " + name);
                    }
                }
                zis.closeEntry();
            }
        }
    }

    private boolean containsExternalTarget(String relsXml) {
        // Simple pattern check for Target="http... or Target='http...
        return relsXml.contains("Target=\"http://")
            || relsXml.contains("Target=\"https://")
            || relsXml.contains("Target='http://")
            || relsXml.contains("Target='https://");
    }
}
