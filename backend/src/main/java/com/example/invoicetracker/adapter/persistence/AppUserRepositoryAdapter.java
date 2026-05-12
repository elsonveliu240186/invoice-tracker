package com.example.invoicetracker.adapter.persistence;

import com.example.invoicetracker.domain.AppUser;
import com.example.invoicetracker.domain.AppUserRepository;
import jakarta.persistence.EntityManager;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter that implements the domain {@link AppUserRepository} port using JPA.
 */
@Component
public class AppUserRepositoryAdapter implements AppUserRepository {

    private final AppUserJpaRepository jpaRepository;
    private final EntityManager entityManager;

    public AppUserRepositoryAdapter(
        AppUserJpaRepository jpaRepository,
        EntityManager entityManager
    ) {
        this.jpaRepository = jpaRepository;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public AppUser save(AppUser user) {
        AppUserEntity managed = entityManager.find(AppUserEntity.class, user.id());
        if (managed != null) {
            managed.setEmail(user.email());
            managed.setDisplayName(user.displayName());
            managed.setPasswordHash(user.passwordHash());
            return toDomain(managed);
        }
        AppUserEntity entity = toEntity(user);
        AppUserEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<AppUser> findByEmail(String email) {
        return jpaRepository.findByEmailIgnoreCaseAndDeletedAtIsNull(email)
            .map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email) {
        return jpaRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(email);
    }

    private AppUser toDomain(AppUserEntity entity) {
        return new AppUser(
            entity.getId(),
            entity.getEmail(),
            entity.getDisplayName(),
            entity.getPasswordHash(),
            entity.getCreatedAt()
        );
    }

    private AppUserEntity toEntity(AppUser user) {
        AppUserEntity entity = new AppUserEntity();
        entity.setId(user.id());
        entity.setEmail(user.email());
        entity.setDisplayName(user.displayName());
        entity.setPasswordHash(user.passwordHash());
        entity.setCreatedAt(user.createdAt() != null ? user.createdAt() : Instant.now());
        return entity;
    }
}
