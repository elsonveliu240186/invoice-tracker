package com.example.invoicetracker.adapter.persistence.client;

import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for {@link ClientEntity}.
 */
public interface ClientJpaRepository extends JpaRepository<ClientEntity, UUID> {

    Optional<ClientEntity> findByIdAndDeletedAtIsNull(UUID id);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNull(String email);

    boolean existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot(String email, UUID id);

    @Query(
        "SELECT c FROM ClientEntity c "
        + "WHERE c.deletedAt IS NULL "
        + "AND (:query IS NULL OR :query = '' "
        + "    OR LOWER(c.name) LIKE LOWER(CONCAT('%', :query, '%')) "
        + "    OR LOWER(c.email) LIKE LOWER(CONCAT('%', :query, '%')))"
    )
    Page<ClientEntity> findAllActiveByQuery(
        @Param("query") String query,
        Pageable pageable
    );
}
