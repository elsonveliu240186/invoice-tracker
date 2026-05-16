package com.example.invoicetracker.adapter.persistence.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.adapter.persistence.client.ClientEntity;
import com.example.invoicetracker.adapter.persistence.client.ClientJpaRepository;
import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import com.example.invoicetracker.domain.invoice.GeneratedArtifact;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class GeneratedArtifactRepositoryAdapterIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    GeneratedArtifactRepositoryAdapter adapter;

    @Autowired
    InvoiceJpaRepository invoiceJpaRepository;

    @Autowired
    ClientJpaRepository clientJpaRepository;

    private UUID invoiceId;

    @BeforeEach
    void seedInvoice() {
        UUID clientId = UUID.randomUUID();
        ClientEntity client = new ClientEntity();
        client.setId(clientId);
        client.setName("IT Client");
        client.setEmail("it-" + clientId + "@example.com");
        clientJpaRepository.saveAndFlush(client);

        invoiceId = UUID.randomUUID();
        InvoiceEntity invoice = new InvoiceEntity();
        invoice.setId(invoiceId);
        invoice.setNumber("IT-INV-" + invoiceId);
        invoice.setClientId(clientId);
        invoice.setIssueDate(LocalDate.now());
        invoice.setDueDate(LocalDate.now().plusDays(30));
        invoice.setTaxRate(new BigDecimal("0.21"));
        invoice.setStatus(com.example.invoicetracker.domain.invoice.InvoiceStatus.DRAFT);
        invoiceJpaRepository.saveAndFlush(invoice);
    }

    @Test
    void upsert_and_find_round_trip() {
        GeneratedArtifact art = artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 100L);

        GeneratedArtifact saved = adapter.upsert(art);
        Optional<GeneratedArtifact> found = adapter.find(invoiceId, ArtifactFormat.PDF);

        assertThat(saved.format()).isEqualTo(ArtifactFormat.PDF);
        assertThat(found).isPresent();
        assertThat(found.get().relativePath()).isEqualTo("inv.pdf");
    }

    @Test
    void findAllByInvoice_returns_active_only() {
        adapter.upsert(artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 100L));
        adapter.upsert(artifact(invoiceId, ArtifactFormat.DOCX, "inv.docx", 120L));

        List<GeneratedArtifact> all = adapter.findAllByInvoice(invoiceId);

        assertThat(all).hasSize(2);
        assertThat(all).extracting(GeneratedArtifact::format)
            .containsExactlyInAnyOrder(ArtifactFormat.PDF, ArtifactFormat.DOCX);
    }

    @Test
    void softDelete_hides_rows_from_find() {
        adapter.upsert(artifact(invoiceId, ArtifactFormat.PDF, "inv.pdf", 100L));

        adapter.softDeleteByInvoice(invoiceId);

        assertThat(adapter.find(invoiceId, ArtifactFormat.PDF)).isEmpty();
        assertThat(adapter.findAllByInvoice(invoiceId)).isEmpty();
    }

    @Test
    void partial_unique_allows_resurrection_after_softdelete() {
        GeneratedArtifact first = adapter.upsert(
            artifact(invoiceId, ArtifactFormat.PDF, "v1.pdf", 100L));
        adapter.softDeleteByInvoice(invoiceId);

        // After soft-delete the partial unique constraint allows a new row for same (invoice,format)
        GeneratedArtifact second = adapter.upsert(
            artifact(invoiceId, ArtifactFormat.PDF, "v2.pdf", 200L));

        assertThat(second.id()).isNotEqualTo(first.id());
        Optional<GeneratedArtifact> active = adapter.find(invoiceId, ArtifactFormat.PDF);
        assertThat(active).isPresent();
        assertThat(active.get().relativePath()).isEqualTo("v2.pdf");
    }

    @Test
    void find_returns_empty_for_unknown_invoice() {
        assertThat(adapter.find(UUID.randomUUID(), ArtifactFormat.PDF)).isEmpty();
    }

    private static GeneratedArtifact artifact(
            UUID invoiceId, ArtifactFormat format, String path, long size) {
        return new GeneratedArtifact(
            UUID.randomUUID(), invoiceId, format, path, size,
            "a".repeat(64), Instant.now(), null
        );
    }
}
