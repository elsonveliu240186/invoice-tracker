package com.example.invoicetracker.adapter.persistence.invoice;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.util.UUID;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * JPA entity for the invoice_generated_artifacts table.
 */
@Entity
@Table(name = "invoice_generated_artifacts")
@Getter
@Setter
@NoArgsConstructor
public class GeneratedArtifactEntity {

    @Id
    @Column(columnDefinition = "uuid")
    private UUID id;

    @Column(name = "invoice_id", nullable = false, columnDefinition = "uuid")
    private UUID invoiceId;

    @Column(nullable = false, length = 8)
    private String format;

    @Column(name = "relative_path", nullable = false, length = 512)
    private String relativePath;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(nullable = false, length = 64)
    private String sha256;

    @Column(name = "generated_at", nullable = false)
    private Instant generatedAt;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    @Version
    @Column(nullable = false)
    private Long version;
}
