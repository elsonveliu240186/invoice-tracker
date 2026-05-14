package com.example.invoicetracker.adapter.persistence.invoice;

import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter that implements the domain {@link InvoiceRepository} port using JPA.
 */
@Component
public class InvoiceRepositoryAdapter implements InvoiceRepository {

    private final InvoiceJpaRepository jpaRepository;
    private final InvoiceEntityMapper mapper;
    private final EntityManager entityManager;

    public InvoiceRepositoryAdapter(
        InvoiceJpaRepository jpaRepository,
        InvoiceEntityMapper mapper,
        EntityManager entityManager
    ) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Override
    public Optional<Invoice> findByIdWithLines(UUID id) {
        return jpaRepository.findByIdWithLinesAndNotDeleted(id).map(mapper::toDomain);
    }

    @Override
    @Transactional
    public Invoice save(Invoice invoice) {
        InvoiceEntity managed = entityManager.find(InvoiceEntity.class, invoice.id());
        if (managed != null) {
            mapper.updateEntity(managed, invoice);
            return mapper.toDomain(managed);
        }
        InvoiceEntity entity = mapper.toEntity(invoice);
        InvoiceEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    @Transactional
    public Invoice markSent(UUID id, Instant ts) {
        int updated = jpaRepository.updateLastSentAt(id, ts);
        if (updated == 0) {
            throw new InvoiceNotFoundException(id);
        }
        // Refresh entity from DB to return the updated state
        entityManager.clear();
        return jpaRepository.findByIdWithLinesAndNotDeleted(id)
            .map(mapper::toDomain)
            .orElseThrow(() -> new InvoiceNotFoundException(id));
    }

    @Override
    public Page<Invoice> findAll(UUID clientId, Pageable pageable) {
        return jpaRepository.findAllActive(clientId, pageable).map(mapper::toDomain);
    }

    @Override
    public boolean existsByNumberIgnoreCaseAndDeletedAtIsNull(String number) {
        return jpaRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(number);
    }
}
