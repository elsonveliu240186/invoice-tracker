package com.example.invoicetracker.adapter.artifact;

import com.example.invoicetracker.application.invoice.GeneratedArtifactProperties;
import com.example.invoicetracker.application.invoice.GeneratedArtifactStore;
import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import java.io.IOException;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.NoSuchFileException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Filesystem-backed {@link GeneratedArtifactStore}.
 *
 * <p>Security measures:
 * <ul>
 *   <li>Path traversal — the base directory is canonicalised at startup; resolved paths that
 *       escape the root throw {@link IllegalArgumentException}.
 *   <li>Atomic write — bytes are written to a {@code .tmp} file then moved to the target path.
 *   <li>Parent directory creation — any missing parent directories are created on write.
 * </ul>
 */
@Component
public class FilesystemGeneratedArtifactStore implements GeneratedArtifactStore {

    private static final Logger log =
        LoggerFactory.getLogger(FilesystemGeneratedArtifactStore.class);

    private final Path canonicalRoot;

    /**
     * Constructs the store and canonicalises the configured base directory.
     *
     * @param props artefact configuration properties
     */
    public FilesystemGeneratedArtifactStore(GeneratedArtifactProperties props) {
        this.canonicalRoot = props.path().toAbsolutePath().normalize();
        log.info("FilesystemGeneratedArtifactStore root={}", canonicalRoot);
    }

    @Override
    public String write(UUID invoiceId, ArtifactFormat format, byte[] bytes) throws IOException {
        String extension = format == ArtifactFormat.PDF ? ".pdf" : ".docx";
        String filename = invoiceId.toString() + extension;
        Path target = resolveAndValidate(filename);

        Files.createDirectories(target.getParent());

        Path tmp = target.getParent().resolve(filename + ".tmp." + System.currentTimeMillis());
        Files.write(tmp, bytes);
        try {
            Files.move(tmp, target,
                StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException ex) {
            Files.move(tmp, target, StandardCopyOption.REPLACE_EXISTING);
        }

        log.info("Artefact written: {} ({} bytes)", target, bytes.length);
        return filename;
    }

    @Override
    public byte[] read(String relativePath) throws IOException {
        Path target = resolveAndValidate(relativePath);
        return Files.readAllBytes(target);
    }

    @Override
    public void delete(String relativePath) throws IOException {
        Path target = resolveAndValidate(relativePath);
        try {
            Files.delete(target);
            log.info("Artefact deleted: {}", target);
        } catch (NoSuchFileException ignored) {
            // Idempotent — file already gone
        }
    }

    /**
     * Resolves the relative path against the canonical root and verifies it does not escape.
     *
     * @param relativePath the relative path segment
     * @return the resolved absolute path
     * @throws IllegalArgumentException if the resolved path escapes the canonical root
     */
    private Path resolveAndValidate(String relativePath) {
        Path resolved = canonicalRoot.resolve(relativePath).normalize();
        if (!resolved.startsWith(canonicalRoot)) {
            throw new IllegalArgumentException(
                "Path traversal rejected: " + relativePath);
        }
        return resolved;
    }
}
