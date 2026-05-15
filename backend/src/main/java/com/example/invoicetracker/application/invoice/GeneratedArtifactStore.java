package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import java.io.IOException;
import java.util.UUID;

/**
 * Port for reading and writing generated artefact bytes on durable storage.
 */
public interface GeneratedArtifactStore {

    /**
     * Writes the given bytes for the specified invoice and format, returning the relative path
     * under which the bytes were stored.
     *
     * @param invoiceId the invoice UUID
     * @param format    the artefact format
     * @param bytes     the rendered bytes to persist
     * @return the relative path (relative to the configured base directory)
     * @throws IOException if the write fails
     */
    String write(UUID invoiceId, ArtifactFormat format, byte[] bytes) throws IOException;

    /**
     * Reads and returns the bytes stored at the given relative path.
     *
     * @param relativePath the relative path returned by a previous {@link #write} call
     * @return the stored bytes
     * @throws IOException if the file cannot be read
     */
    byte[] read(String relativePath) throws IOException;

    /**
     * Deletes the file at the given relative path. Idempotent — no exception if the file is
     * already gone.
     *
     * @param relativePath the relative path to delete
     * @throws IOException if deletion fails for a reason other than the file being absent
     */
    void delete(String relativePath) throws IOException;
}
