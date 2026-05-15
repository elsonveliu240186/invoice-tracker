package com.example.invoicetracker.adapter.artifact;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.invoicetracker.application.invoice.GeneratedArtifactProperties;
import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class FilesystemGeneratedArtifactStoreTest {

    @TempDir
    Path tempDir;

    FilesystemGeneratedArtifactStore store;

    @BeforeEach
    void setUp() {
        GeneratedArtifactProperties props =
            new GeneratedArtifactProperties(tempDir, 26_214_400L, true);
        store = new FilesystemGeneratedArtifactStore(props);
    }

    @Test
    void write_creates_file_and_returns_filename() throws IOException {
        UUID id = UUID.randomUUID();
        byte[] bytes = "pdf-content".getBytes();

        String relativePath = store.write(id, ArtifactFormat.PDF, bytes);

        assertThat(relativePath).isEqualTo(id + ".pdf");
        Path written = tempDir.resolve(relativePath);
        assertThat(Files.exists(written)).isTrue();
        assertThat(Files.readAllBytes(written)).isEqualTo(bytes);
    }

    @Test
    void write_creates_docx_file() throws IOException {
        UUID id = UUID.randomUUID();
        String relativePath = store.write(id, ArtifactFormat.DOCX, "docx".getBytes());

        assertThat(relativePath).isEqualTo(id + ".docx");
        assertThat(Files.exists(tempDir.resolve(relativePath))).isTrue();
    }

    @Test
    void read_returns_bytes_round_trip() throws IOException {
        UUID id = UUID.randomUUID();
        byte[] expected = "hello world".getBytes();
        String path = store.write(id, ArtifactFormat.PDF, expected);

        byte[] actual = store.read(path);

        assertThat(actual).isEqualTo(expected);
    }

    @Test
    void read_throws_when_file_missing() {
        assertThatThrownBy(() -> store.read("nonexistent.pdf"))
            .isInstanceOf(IOException.class);
    }

    @Test
    void delete_removes_file() throws IOException {
        UUID id = UUID.randomUUID();
        String path = store.write(id, ArtifactFormat.PDF, "data".getBytes());

        store.delete(path);

        assertThat(Files.exists(tempDir.resolve(path))).isFalse();
    }

    @Test
    void delete_is_idempotent_when_file_already_gone() throws IOException {
        // Must not throw
        store.delete("does-not-exist.pdf");
    }

    @Test
    void rejects_path_traversal_attempts() {
        assertThatThrownBy(() -> store.read("../etc/passwd"))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Path traversal");
    }

    @Test
    void write_overwrites_existing_file_atomically() throws IOException {
        UUID id = UUID.randomUUID();
        store.write(id, ArtifactFormat.PDF, "v1".getBytes());
        String path = store.write(id, ArtifactFormat.PDF, "v2".getBytes());

        assertThat(store.read(path)).isEqualTo("v2".getBytes());
    }
}
