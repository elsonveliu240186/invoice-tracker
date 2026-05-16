package com.example.invoicetracker.application.invoice;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties controlling generated artefact storage.
 *
 * <ul>
 *   <li>{@code app.invoice.generated.path} — filesystem base directory (default
 *       {@code ./generated/invoices})
 *   <li>{@code app.invoice.generated.max-bytes-per-artifact} — maximum bytes per artefact
 *       (default 25 MiB)
 *   <li>{@code app.invoice.generated.enabled} — whether artefact persistence is active
 *       (default {@code true})
 * </ul>
 */
@ConfigurationProperties("app.invoice.generated")
public record GeneratedArtifactProperties(
    Path path,
    long maxBytesPerArtifact,
    boolean enabled
) {

    /**
     * Canonical constructor applying defaults for optional fields.
     */
    public GeneratedArtifactProperties {
        if (path == null) {
            path = Path.of("./generated/invoices");
        }
        if (maxBytesPerArtifact <= 0) {
            maxBytesPerArtifact = 26_214_400L; // 25 MiB
        }
    }
}
