package com.example.invoicetracker.application.client;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientEmailTakenException;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import java.time.Instant;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for client use-cases.
 */
@Service
@Transactional
public class ClientService {

    private static final Logger log = LoggerFactory.getLogger(ClientService.class);

    private final ClientRepository clientRepository;

    public ClientService(ClientRepository clientRepository) {
        this.clientRepository = clientRepository;
    }

    /**
     * Creates a new client.
     *
     * @param cmd the create command
     * @return the created client domain object
     */
    public Client create(ClientCommand.Create cmd) {
        if (clientRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull(cmd.email())) {
            throw new ClientEmailTakenException(cmd.email());
        }
        Instant now = Instant.now();
        Client client = new Client(
            UUID.randomUUID(),
            cmd.name(),
            cmd.email(),
            cmd.phone(),
            cmd.address(),
            now,
            now,
            null
        );
        Client saved = clientRepository.save(client);
        log.info("Client created: {}", saved.id());
        return saved;
    }

    /**
     * Lists clients with optional search query, with pagination.
     * Size is clamped to [1, 100].
     *
     * @param query    optional case-insensitive substring match on name or email
     * @param pageable the pageable (size will be clamped)
     * @return a page of clients
     */
    @Transactional(readOnly = true)
    public Page<Client> list(String query, Pageable pageable) {
        int clampedSize = Math.max(1, Math.min(100, pageable.getPageSize()));
        Pageable clamped = PageRequest.of(
            pageable.getPageNumber(),
            clampedSize,
            pageable.getSortOr(Sort.by(Sort.Direction.ASC, "name"))
        );
        return clientRepository.findAllByDeletedAtIsNull(query, clamped);
    }

    /**
     * Retrieves a client by ID.
     *
     * @param id the client UUID
     * @return the client domain object
     * @throws ClientNotFoundException if not found or soft-deleted
     */
    @Transactional(readOnly = true)
    public Client get(UUID id) {
        return clientRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ClientNotFoundException(id));
    }

    /**
     * Updates an existing client (full replacement, PUT semantics).
     *
     * @param id  the client UUID
     * @param cmd the update command
     * @return the updated client domain object
     */
    public Client update(UUID id, ClientCommand.Update cmd) {
        Client existing = clientRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ClientNotFoundException(id));

        boolean emailChanged = !existing.email().equalsIgnoreCase(cmd.email());
        if (emailChanged
            && clientRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(cmd.email(), id)) {
            throw new ClientEmailTakenException(cmd.email());
        }

        Client updated = new Client(
            existing.id(),
            cmd.name(),
            cmd.email(),
            cmd.phone(),
            cmd.address(),
            existing.createdAt(),
            Instant.now(),
            null
        );
        Client saved = clientRepository.save(updated);
        log.info("Client updated: {}", saved.id());
        return saved;
    }

    /**
     * Soft-deletes a client by setting deletedAt.
     *
     * @param id the client UUID
     * @throws ClientNotFoundException if not found or already soft-deleted
     */
    public void delete(UUID id) {
        Client existing = clientRepository.findByIdAndDeletedAtIsNull(id)
            .orElseThrow(() -> new ClientNotFoundException(id));

        Client deleted = new Client(
            existing.id(),
            existing.name(),
            existing.email(),
            existing.phone(),
            existing.address(),
            existing.createdAt(),
            existing.updatedAt(),
            Instant.now()
        );
        clientRepository.save(deleted);
        log.info("Client soft-deleted: {}", id);
    }
}
