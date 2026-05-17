package com.example.invoicetracker.adapter.persistence.invoice;

import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import com.example.invoicetracker.domain.invoice.GeneratedArtifact;
import org.springframework.stereotype.Component;

/**
 * Maps between {@link GeneratedArtifactEntity} and {@link GeneratedArtifact} domain record.
 */
@Component
public class GeneratedArtifactEntityMapper {

    /**
     * Maps a JPA entity to the domain record.
     *
     * @param entity the JPA entity
     * @return the domain record
     */
    public GeneratedArtifact toDomain(GeneratedArtifactEntity entity) {
        return new GeneratedArtifact(
            entity.getId(),
            entity.getInvoiceId(),
            ArtifactFormat.valueOf(entity.getFormat()),
            entity.getRelativePath(),
            entity.getSizeBytes(),
            entity.getSha256(),
            entity.getGeneratedAt(),
            entity.getDeletedAt()
        );
    }

    /**
     * Maps a domain record to a new JPA entity.
     *
     * @param artifact the domain record
     * @return the JPA entity
     */
    public GeneratedArtifactEntity toEntity(GeneratedArtifact artifact) {
        GeneratedArtifactEntity entity = new GeneratedArtifactEntity();
        entity.setId(artifact.id());
        entity.setInvoiceId(artifact.invoiceId());
        entity.setFormat(artifact.format().name());
        entity.setRelativePath(artifact.relativePath());
        entity.setSizeBytes(artifact.sizeBytes());
        entity.setSha256(artifact.sha256());
        entity.setGeneratedAt(artifact.generatedAt());
        entity.setDeletedAt(artifact.deletedAt());
        return entity;
    }
}
