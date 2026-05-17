package com.example.invoicetracker.adapter.persistence.invoice;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Spring Data JPA repository for {@link GeneratedArtifactEntity}.
 */
public interface GeneratedArtifactJpaRepository
    extends JpaRepository<GeneratedArtifactEntity, UUID> {

    /**
     * Finds an active (non-deleted) artefact for the given invoice and format.
     *
     * @param invoiceId the invoice UUID
     * @param format    the format name
     * @return Optional containing the entity
     */
    @Query("SELECT a FROM GeneratedArtifactEntity a "
        + "WHERE a.invoiceId = :invoiceId AND a.format = :format AND a.deletedAt IS NULL")
    Optional<GeneratedArtifactEntity> findActiveByInvoiceAndFormat(
        @Param("invoiceId") UUID invoiceId,
        @Param("format") String format
    );

    /**
     * Finds all active artefacts for the given invoice.
     *
     * @param invoiceId the invoice UUID
     * @return list of active entities
     */
    @Query("SELECT a FROM GeneratedArtifactEntity a "
        + "WHERE a.invoiceId = :invoiceId AND a.deletedAt IS NULL")
    List<GeneratedArtifactEntity> findAllActiveByInvoice(@Param("invoiceId") UUID invoiceId);

    /**
     * Soft-deletes all active artefacts for the given invoice.
     *
     * @param invoiceId  the invoice UUID
     * @param deletedAt  the deletion timestamp
     */
    @Modifying
    @Query("UPDATE GeneratedArtifactEntity a SET a.deletedAt = :deletedAt "
        + "WHERE a.invoiceId = :invoiceId AND a.deletedAt IS NULL")
    void softDeleteByInvoice(
        @Param("invoiceId") UUID invoiceId,
        @Param("deletedAt") Instant deletedAt
    );
}
