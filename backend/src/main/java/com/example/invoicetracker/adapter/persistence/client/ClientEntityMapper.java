package com.example.invoicetracker.adapter.persistence.client;

import com.example.invoicetracker.domain.client.Client;
import org.springframework.stereotype.Component;

/**
 * Plain mapper between {@link ClientEntity} and {@link Client} domain record.
 */
@Component
public class ClientEntityMapper {

    /**
     * Maps a JPA entity to the domain record.
     *
     * @param entity the JPA entity
     * @return the domain record
     */
    public Client toDomain(ClientEntity entity) {
        return new Client(
            entity.getId(),
            entity.getName(),
            entity.getEmail(),
            entity.getPhone(),
            entity.getAddress(),
            entity.getCreatedAt(),
            entity.getUpdatedAt(),
            entity.getDeletedAt()
        );
    }

    /**
     * Maps a domain record to a JPA entity, preserving the version field if present.
     *
     * @param client the domain record
     * @return the JPA entity
     */
    public ClientEntity toEntity(Client client) {
        ClientEntity entity = new ClientEntity();
        entity.setId(client.id());
        entity.setName(client.name());
        entity.setEmail(client.email());
        entity.setPhone(client.phone());
        entity.setAddress(client.address());
        entity.setCreatedAt(client.createdAt());
        entity.setUpdatedAt(client.updatedAt());
        entity.setDeletedAt(client.deletedAt());
        return entity;
    }

    /**
     * Updates a managed JPA entity's mutable fields from the domain record.
     * Used when the entity is already in the JPA session to avoid detached-entity conflicts.
     *
     * @param entity the managed JPA entity to update
     * @param client the domain record with the new values
     */
    public void updateEntity(ClientEntity entity, Client client) {
        entity.setName(client.name());
        entity.setEmail(client.email());
        entity.setPhone(client.phone());
        entity.setAddress(client.address());
        entity.setDeletedAt(client.deletedAt());
    }
}
