package com.example.invoicetracker.adapter.persistence.company;

import com.example.invoicetracker.domain.company.CompanyProfile;
import com.example.invoicetracker.domain.company.CompanyProfileRepository;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter that implements the domain {@link CompanyProfileRepository} port using JPA.
 */
@Component
public class CompanyProfileRepositoryAdapter implements CompanyProfileRepository {

    private static final Short SINGLETON_ID = 1;

    private final CompanyProfileJpaRepository jpaRepository;
    private final EntityManager entityManager;

    public CompanyProfileRepositoryAdapter(
        CompanyProfileJpaRepository jpaRepository,
        EntityManager entityManager
    ) {
        this.jpaRepository = jpaRepository;
        this.entityManager = entityManager;
    }

    @Override
    public Optional<CompanyProfile> find() {
        return jpaRepository.findById(SINGLETON_ID).map(this::toDomain);
    }

    @Override
    @Transactional
    public CompanyProfile save(CompanyProfile profile) {
        // If the singleton entity is already managed in the current session, update in-place
        // to avoid NonUniqueObjectException on merge (same pattern as ClientRepositoryAdapter).
        CompanyProfileEntity managed = entityManager.find(
            CompanyProfileEntity.class, SINGLETON_ID);
        if (managed != null) {
            updateEntity(managed, profile);
            return toDomain(managed);
        }
        CompanyProfileEntity entity = jpaRepository.findById(SINGLETON_ID)
            .orElseGet(CompanyProfileEntity::new);
        updateEntity(entity, profile);
        CompanyProfileEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    private void updateEntity(CompanyProfileEntity entity, CompanyProfile profile) {
        entity.setName(profile.name());
        entity.setAddress(profile.address());
        entity.setPhone(profile.phone());
        entity.setEmail(profile.email());
        entity.setVatNumber(profile.vatNumber());
        entity.setIban(profile.iban());
        entity.setSwiftBic(profile.swiftBic());
        entity.setBankName(profile.bankName());
    }

    private CompanyProfile toDomain(CompanyProfileEntity entity) {
        return new CompanyProfile(
            entity.getName(),
            entity.getAddress(),
            entity.getPhone(),
            entity.getEmail(),
            entity.getVatNumber(),
            entity.getIban(),
            entity.getSwiftBic(),
            entity.getBankName(),
            entity.getUpdatedAt()
        );
    }
}
