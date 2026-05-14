package com.example.invoicetracker.adapter.persistence.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.invoicetracker.adapter.persistence.client.ClientEntity;
import com.example.invoicetracker.adapter.persistence.client.ClientJpaRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class InvoiceRepositoryAdapterIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    InvoiceRepositoryAdapter adapter;

    @Autowired
    InvoiceJpaRepository jpaRepository;

    @Autowired
    ClientJpaRepository clientJpaRepository;

    private UUID clientId;

    @BeforeEach
    void seedClient() {
        clientId = UUID.randomUUID();
        ClientEntity client = new ClientEntity();
        client.setId(clientId);
        client.setName("Test Client");
        client.setEmail("test-" + clientId + "@example.com");
        clientJpaRepository.saveAndFlush(client);
    }

    private Invoice buildInvoice(String number) {
        Instant now = Instant.now();
        List<InvoiceLine> lines = List.of(
            new InvoiceLine(UUID.randomUUID(), "Service A", 2, new BigDecimal("100.00"), 0),
            new InvoiceLine(UUID.randomUUID(), "Service B", 1, new BigDecimal("50.00"), 1),
            new InvoiceLine(UUID.randomUUID(), "Service C", 3, new BigDecimal("25.00"), 2)
        );
        return new Invoice(
            UUID.randomUUID(),
            number,
            clientId,
            LocalDate.of(2026, 5, 1),
            LocalDate.of(2026, 6, 1),
            lines,
            new BigDecimal("0.20"),
            null,
            now,
            now,
            null,
            null
        );
    }

    @Test
    void persists_invoice_with_lines() {
        Invoice invoice = buildInvoice("INV-IT-001");
        Invoice saved = adapter.save(invoice);

        Optional<Invoice> found = adapter.findByIdWithLines(saved.id());
        assertThat(found).isPresent();
        assertThat(found.get().number()).isEqualTo("INV-IT-001");
        assertThat(found.get().lines()).hasSize(3);
        assertThat(found.get().lines().get(0).description()).isEqualTo("Service A");
        assertThat(found.get().subtotal()).isEqualByComparingTo("325.00");
        assertThat(found.get().total()).isEqualByComparingTo("390.00");
    }

    @Test
    void markSent_updates_only_timestamp() {
        Invoice invoice = buildInvoice("INV-IT-002");
        Invoice saved = adapter.save(invoice);
        assertThat(saved.lastSentAt()).isNull();

        Instant sentAt = Instant.now();
        Invoice updated = adapter.markSent(saved.id(), sentAt);

        assertThat(updated.lastSentAt()).isNotNull();
        assertThat(updated.number()).isEqualTo("INV-IT-002");
        assertThat(updated.lines()).hasSize(3);
    }

    @Test
    void markSent_throws_when_invoice_not_found() {
        UUID unknownId = UUID.randomUUID();
        assertThatThrownBy(() -> adapter.markSent(unknownId, Instant.now()))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    @Test
    void partial_unique_index_blocks_duplicate_number() {
        Invoice first = buildInvoice("INV-UNIQUE-001");
        adapter.save(first);

        Invoice second = buildInvoice("INV-UNIQUE-001");
        assertThatThrownBy(() -> {
            adapter.save(second);
            jpaRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void find_returns_empty_for_deleted_invoice() {
        Invoice invoice = buildInvoice("INV-IT-SOFT");
        Invoice saved = adapter.save(invoice);

        // Soft-delete by saving with deletedAt set
        Instant now = Instant.now();
        Invoice deleted = new Invoice(
            saved.id(), saved.number(), saved.clientId(),
            saved.issueDate(), saved.dueDate(), saved.lines(),
            saved.taxRate(), null, saved.createdAt(), saved.updatedAt(), now, null);
        adapter.save(deleted);

        Optional<Invoice> found = adapter.findByIdWithLines(saved.id());
        assertThat(found).isEmpty();
    }

    @Test
    void existsByNumber_returns_true_when_number_exists() {
        Invoice invoice = buildInvoice("INV-EXISTS-001");
        adapter.save(invoice);

        assertThat(adapter.existsByNumberIgnoreCaseAndDeletedAtIsNull("INV-EXISTS-001")).isTrue();
        assertThat(adapter.existsByNumberIgnoreCaseAndDeletedAtIsNull("inv-exists-001")).isTrue();
        assertThat(adapter.existsByNumberIgnoreCaseAndDeletedAtIsNull("INV-NONEXISTENT")).isFalse();
    }

    @Test
    void findAll_with_client_filter_returns_matching_invoices() {
        Invoice inv1 = buildInvoice("INV-PAGE-001");
        Invoice inv2 = buildInvoice("INV-PAGE-002");
        adapter.save(inv1);
        adapter.save(inv2);

        // Create another client with another invoice
        UUID otherClientId = UUID.randomUUID();
        ClientEntity other = new ClientEntity();
        other.setId(otherClientId);
        other.setName("Other Client");
        other.setEmail("other-" + otherClientId + "@example.com");
        clientJpaRepository.saveAndFlush(other);

        Instant now = Instant.now();
        Invoice otherInv = new Invoice(UUID.randomUUID(), "INV-OTHER-001", otherClientId,
            LocalDate.now(), LocalDate.now().plusDays(30),
            List.of(new InvoiceLine(UUID.randomUUID(), "Item", 1, new BigDecimal("10.00"), 0)),
            BigDecimal.ZERO, null, now, now, null, null);
        adapter.save(otherInv);

        org.springframework.data.domain.Page<Invoice> result = adapter.findAll(
            clientId, org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(result.getContent()).extracting(Invoice::number)
            .containsExactlyInAnyOrder("INV-PAGE-001", "INV-PAGE-002");
    }
}
