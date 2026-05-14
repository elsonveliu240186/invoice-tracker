package com.example.invoicetracker.adapter.persistence.invoice;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for {@link InvoiceEntity}.
 */
public interface InvoiceJpaRepository extends JpaRepository<InvoiceEntity, UUID> {

    @EntityGraph(attributePaths = "lines")
    @Query("SELECT i FROM InvoiceEntity i WHERE i.id = :id AND i.deletedAt IS NULL")
    Optional<InvoiceEntity> findByIdWithLinesAndNotDeleted(@Param("id") UUID id);

    @Modifying
    @Query("UPDATE InvoiceEntity i SET i.lastSentAt = :ts WHERE i.id = :id")
    int updateLastSentAt(@Param("id") UUID id, @Param("ts") Instant ts);

    @EntityGraph(attributePaths = "lines")
    @Query(
        "SELECT i FROM InvoiceEntity i WHERE i.deletedAt IS NULL "
        + "AND (:clientId IS NULL OR i.clientId = :clientId)"
    )
    Page<InvoiceEntity> findAllActive(
        @Param("clientId") UUID clientId,
        Pageable pageable
    );

    boolean existsByNumberIgnoreCaseAndDeletedAtIsNull(String number);
}
