package com.example.invoicetracker.adapter.persistence.client;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientRepository;
import jakarta.persistence.EntityManager;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Adapter that implements the domain {@link ClientRepository} port using JPA.
 */
@Component
public class ClientRepositoryAdapter implements ClientRepository {

    private final ClientJpaRepository jpaRepository;
    private final ClientEntityMapper mapper;
    private final EntityManager entityManager;

    public ClientRepositoryAdapter(
        ClientJpaRepository jpaRepository,
        ClientEntityMapper mapper,
        EntityManager entityManager
    ) {
        this.jpaRepository = jpaRepository;
        this.mapper = mapper;
        this.entityManager = entityManager;
    }

    @Override
    @Transactional
    public Client save(Client client) {
        // If an entity with this ID is already managed in the current session,
        // update its fields in-place to avoid NonUniqueObjectException on merge.
        ClientEntity managed = entityManager.find(ClientEntity.class, client.id());
        if (managed != null) {
            mapper.updateEntity(managed, client);
            return mapper.toDomain(managed);
        }
        ClientEntity entity = mapper.toEntity(client);
        ClientEntity saved = jpaRepository.save(entity);
        return mapper.toDomain(saved);
    }

    @Override
    public Optional<Client> findByIdAndDeletedAtIsNull(UUID id) {
        return jpaRepository.findByIdAndDeletedAtIsNull(id).map(mapper::toDomain);
    }

    @Override
    public boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email) {
        return jpaRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(email);
    }

    @Override
    public boolean existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(String email, UUID excludeId) {
        return jpaRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(email, excludeId);
    }

    @Override
    public Page<Client> findAllByDeletedAtIsNull(String query, Pageable pageable) {
        return jpaRepository.findAllActiveByQuery(query, pageable).map(mapper::toDomain);
    }
}
