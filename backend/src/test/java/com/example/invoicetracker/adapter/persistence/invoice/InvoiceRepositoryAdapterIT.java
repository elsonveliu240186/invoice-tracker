package com.example.invoicetracker.adapter.persistence.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.invoicetracker.adapter.persistence.client.ClientEntity;
import com.example.invoicetracker.adapter.persistence.client.ClientJpaRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
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
            InvoiceStatus.DRAFT,
            null,
            now,
            now,
            null,
            null,
            "Test Client",
            "123 Main St",
            "Test Corp",
            "456 Business Ave",
            "VAT123",
            "IBAN456",
            "SWIFT789",
            "Test Bank"
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
            saved.taxRate(), InvoiceStatus.DRAFT, null, saved.createdAt(), saved.updatedAt(),
            now, null,
            saved.clientNameSnapshot(), saved.clientAddressSnapshot(),
            saved.companyNameSnapshot(), saved.companyAddressSnapshot(),
            saved.companyVatSnapshot(), saved.companyIbanSnapshot(),
            saved.companySwiftSnapshot(), saved.companyBankNameSnapshot());
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
    void markPaid_persists_status_paid() {
        Invoice invoice = buildInvoice("INV-MARKPAID-001");
        Invoice saved = adapter.save(invoice);
        assertThat(saved.status()).isEqualTo(InvoiceStatus.DRAFT);

        Invoice paid = adapter.markPaid(saved.id());

        assertThat(paid.status()).isEqualTo(InvoiceStatus.PAID);
        // Also verify directly via JPA
        InvoiceEntity entity = jpaRepository.findById(saved.id()).orElseThrow();
        assertThat(entity.getStatus()).isEqualTo(InvoiceStatus.PAID);
    }

    @Test
    void countByStatus_returns_grouped_counts() {
        // Seed 2 DRAFT invoices (default) and 1 PAID invoice
        Invoice draft1 = buildInvoice("INV-CNT-DRAFT-1");
        Invoice draft2 = buildInvoice("INV-CNT-DRAFT-2");
        Invoice paidSrc = buildInvoice("INV-CNT-PAID-1");

        adapter.save(draft1);
        adapter.save(draft2);
        Invoice saved3 = adapter.save(paidSrc);
        adapter.markPaid(saved3.id());

        List<Object[]> rows = adapter.countByStatus();

        Map<String, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put(String.valueOf(row[0]), ((Number) row[1]).longValue());
        }

        assertThat(map.get("DRAFT")).isGreaterThanOrEqualTo(2L);
        assertThat(map.get("PAID")).isGreaterThanOrEqualTo(1L);
    }

    @Test
    void revenueByMonth_groups_by_yyyy_mm() {
        // Seed 2 invoices in current month with known line totals
        // Each invoice: 1 line of quantity=1, unitPrice=100.00, taxRate=0.00 → total=100.00
        LocalDate today = LocalDate.now();
        Instant now = Instant.now();

        Invoice inv1 = new Invoice(
            UUID.randomUUID(), "INV-REV-001", clientId,
            today, today.plusDays(30),
            List.of(new InvoiceLine(UUID.randomUUID(), "Svc", 1, new BigDecimal("100.00"), 0)),
            BigDecimal.ZERO, InvoiceStatus.DRAFT, null, now, now, null, null,
            "Test Client", "", "Test Corp", "", "", "", "", ""
        );
        Invoice inv2 = new Invoice(
            UUID.randomUUID(), "INV-REV-002", clientId,
            today, today.plusDays(30),
            List.of(new InvoiceLine(UUID.randomUUID(), "Svc", 1, new BigDecimal("150.00"), 0)),
            BigDecimal.ZERO, InvoiceStatus.DRAFT, null, now, now, null, null,
            "Test Client", "", "Test Corp", "", "", "", "", ""
        );
        adapter.save(inv1);
        adapter.save(inv2);

        List<Object[]> rows = adapter.revenueByMonth(6);

        String currentMonth = today.getYear() + "-"
            + String.format("%02d", today.getMonthValue());

        // Find the current-month entry
        Optional<Object[]> currentRow = rows.stream()
            .filter(r -> currentMonth.equals(String.valueOf(r[0])))
            .findFirst();

        assertThat(currentRow).isPresent();
        BigDecimal revenue = new BigDecimal(currentRow.get()[1].toString());
        // At minimum the two invoices we seeded: 100 + 150 = 250
        assertThat(revenue).isGreaterThanOrEqualTo(new BigDecimal("250.00"));
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
            BigDecimal.ZERO, InvoiceStatus.DRAFT, null, now, now, null, null,
            "Other Client", "", "Other Corp", "", "", "", "", "");
        adapter.save(otherInv);

        org.springframework.data.domain.Page<Invoice> result = adapter.findAll(
            clientId, org.springframework.data.domain.PageRequest.of(0, 10));
        assertThat(result.getContent()).extracting(Invoice::number)
            .containsExactlyInAnyOrder("INV-PAGE-001", "INV-PAGE-002");
    }
}
