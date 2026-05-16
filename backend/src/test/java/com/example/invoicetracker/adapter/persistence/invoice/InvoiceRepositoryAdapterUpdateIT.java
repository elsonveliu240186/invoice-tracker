package com.example.invoicetracker.adapter.persistence.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.adapter.persistence.client.ClientEntity;
import com.example.invoicetracker.adapter.persistence.client.ClientJpaRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
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
class InvoiceRepositoryAdapterUpdateIT {

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
        client.setName("Update Test Client");
        client.setEmail("update-" + clientId + "@example.com");
        clientJpaRepository.saveAndFlush(client);
    }

    private Invoice buildInvoice(String number) {
        Instant now = Instant.now();
        List<InvoiceLine> lines = List.of(
            new InvoiceLine(UUID.randomUUID(), "Original Line", 1, new BigDecimal("100.00"), 0)
        );
        return new Invoice(
            UUID.randomUUID(), number, clientId,
            LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 1),
            lines, new BigDecimal("0.10"), InvoiceStatus.DRAFT,
            null, now, now, null, null,
            "Update Test Client", "", "Test Corp", "", "", "", "", ""
        );
    }

    @Test
    void update_replaces_lines_preserves_id() {
        Invoice original = buildInvoice("INV-UPD-001");
        Invoice saved = adapter.save(original);

        List<InvoiceLine> newLines = List.of(
            new InvoiceLine(UUID.randomUUID(), "New Line A", 2, new BigDecimal("50.00"), 0),
            new InvoiceLine(UUID.randomUUID(), "New Line B", 1, new BigDecimal("25.00"), 1)
        );
        Instant now = Instant.now();
        Invoice toUpdate = new Invoice(
            saved.id(), saved.number(), clientId,
            saved.issueDate(), saved.dueDate(),
            newLines, saved.taxRate(), InvoiceStatus.DRAFT,
            null, saved.createdAt(), now, null, null,
            "Updated Client", "", "Updated Corp", "", "", "", "", ""
        );

        Invoice updated = adapter.update(toUpdate);

        assertThat(updated.id()).isEqualTo(saved.id());
        assertThat(updated.lines()).hasSize(2);
        assertThat(updated.lines().get(0).description()).isEqualTo("New Line A");
        assertThat(updated.lines().get(1).description()).isEqualTo("New Line B");

        // Verify persistence via direct JPA lookup
        Optional<Invoice> reloaded = adapter.findByIdWithLines(saved.id());
        assertThat(reloaded).isPresent();
        assertThat(reloaded.get().lines()).hasSize(2);
    }

    @Test
    void findMaxNumberForYear_returns_expected_for_year_partition() {
        // Seed invoices for two years
        Invoice inv2025 = new Invoice(
            UUID.randomUUID(), "INV-2025-0005", clientId,
            LocalDate.of(2025, 5, 1), LocalDate.of(2025, 6, 1),
            List.of(new InvoiceLine(UUID.randomUUID(), "Svc", 1, new BigDecimal("100.00"), 0)),
            BigDecimal.ZERO, InvoiceStatus.DRAFT, null, Instant.now(), Instant.now(), null, null,
            "Test Client", "", "Test Corp", "", "", "", "", ""
        );
        Invoice inv2026a = new Invoice(
            UUID.randomUUID(), "INV-2026-0003", clientId,
            LocalDate.of(2026, 5, 1), LocalDate.of(2026, 6, 1),
            List.of(new InvoiceLine(UUID.randomUUID(), "Svc", 1, new BigDecimal("100.00"), 0)),
            BigDecimal.ZERO, InvoiceStatus.DRAFT, null, Instant.now(), Instant.now(), null, null,
            "Test Client", "", "Test Corp", "", "", "", "", ""
        );
        Invoice inv2026b = new Invoice(
            UUID.randomUUID(), "INV-2026-0007", clientId,
            LocalDate.of(2026, 5, 2), LocalDate.of(2026, 6, 2),
            List.of(new InvoiceLine(UUID.randomUUID(), "Svc", 1, new BigDecimal("200.00"), 0)),
            BigDecimal.ZERO, InvoiceStatus.DRAFT, null, Instant.now(), Instant.now(), null, null,
            "Test Client", "", "Test Corp", "", "", "", "", ""
        );

        adapter.save(inv2025);
        adapter.save(inv2026a);
        adapter.save(inv2026b);

        String max2026 = adapter.findMaxNumberForYear(2026);
        String max2025 = adapter.findMaxNumberForYear(2025);
        String max2027 = adapter.findMaxNumberForYear(2027);

        assertThat(max2026).isEqualTo("INV-2026-0007");
        assertThat(max2025).isEqualTo("INV-2025-0005");
        assertThat(max2027).isNull();
    }
}
