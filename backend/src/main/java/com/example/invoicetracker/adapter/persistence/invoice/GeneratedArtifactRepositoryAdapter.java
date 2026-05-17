package com.example.invoicetracker.adapter.persistence.invoice;

import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import com.example.invoicetracker.domain.invoice.GeneratedArtifact;
import com.example.invoicetracker.domain.invoice.GeneratedArtifactRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter that implements the domain {@link GeneratedArtifactRepository} port using JPA.
 */
@Component
public class GeneratedArtifactRepositoryAdapter implements GeneratedArtifactRepository {

    private final GeneratedArtifactJpaRepository jpaRepository;
    private final GeneratedArtifactEntityMapper mapper;

    /**
     * Constructs the adapter.
     *
     * @param jpaRepository the Spring Data JPA repository
     * @param mapper        the entity-to-domain mapper
     */
    public GeneratedArtifactRepositoryAdapter(
        GeneratedArtifactJpaRepository jpaRepository,
        GeneratedArtifactEntityMapper mapper
    ) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
    }

    @Override
    public Optional<GeneratedArtifact> find(UUID invoiceId, ArtifactFormat format) {
        return jpaRepository
            .findActiveByInvoiceAndFormat(invoiceId, format.name())
            .map(mapper::toDomain);
    }

    @Override
    public List<GeneratedArtifact> findAllByInvoice(UUID invoiceId) {
        return jpaRepository
            .findAllActiveByInvoice(invoiceId)
            .stream()
            .map(mapper::toDomain)
            .toList();
    }

    @Override
    @Transactional
    public GeneratedArtifact upsert(GeneratedArtifact artifact) {
        GeneratedArtifactEntity entity = mapper.toEntity(artifact);
        GeneratedArtifactEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public void softDeleteByInvoice(UUID invoiceId) {
        jpaRepository.softDeleteByInvoice(invoiceId, Instant.now());
    }
}
