package com.example.invoicetracker.domain.client;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Domain port for client persistence operations.
 */
public interface ClientRepository {

    Client save(Client client);

    Optional<Client> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(String email, UUID excludeId);

    Page<Client> findAllByDeletedAtIsNull(String query, Pageable pageable);
}
