package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.application.company.CompanyProfileResolver;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
import com.example.invoicetracker.domain.invoice.InvoiceNotEditableException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceNumberTakenException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import com.example.invoicetracker.domain.invoice.InvoiceStatus;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceUpdateTest {

    @Mock
    private InvoiceRepository invoiceRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private InvoicePdfRenderer pdfRenderer;
    @Mock
    private InvoiceMailer mailer;
    @Mock
    private InvoiceArtifactService artifactService;
    @Mock
    private CompanyProfileResolver companyProfileResolver;
    private InvoiceService service;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient().when(companyProfileResolver.resolve())
            .thenReturn(InvoiceFixtures.company());
        service = new InvoiceService(
            invoiceRepository, clientRepository, pdfRenderer, mailer,
            companyProfileResolver, artifactService);
    }

    @Test
    void update_draft_succeeds_and_replaces_lines() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice existing = InvoiceFixtures.invoice(id, clientId);
        assertThat(existing.status()).isEqualTo(InvoiceStatus.DRAFT);

        List<InvoiceLine> newLines = List.of(
            InvoiceFixtures.line("Updated Item", 2, "75.00")
        );
        Invoice updated = new Invoice(
            id, existing.number(), clientId,
            existing.issueDate(), existing.dueDate(), newLines,
            existing.taxRate(), InvoiceStatus.DRAFT,
            null, existing.createdAt(), Instant.now(), null, null,
            null, null, null, null, null, null, null, null
        );

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(existing));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "acme@example.com")));
        when(invoiceRepository.update(any())).thenReturn(updated);

        Invoice result = service.update(id, existing.number(), clientId,
            existing.issueDate(), existing.dueDate(), newLines, existing.taxRate());

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.lines()).hasSize(1);
        assertThat(result.lines().get(0).description()).isEqualTo("Updated Item");
    }

    @Test
    void update_sent_throws_not_editable() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice sentInvoice = new Invoice(
            id, "INV-2026-0001", clientId,
            LocalDate.now(), LocalDate.now().plusDays(30),
            List.of(InvoiceFixtures.line("Item", 1, "100.00")),
            BigDecimal.ZERO, InvoiceStatus.SENT,
            Instant.now(), Instant.now(), Instant.now(), null, null,
            null, null, null, null, null, null, null, null
        );

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(sentInvoice));

        assertThatThrownBy(() ->
            service.update(id, "INV-2026-0001", clientId,
                LocalDate.now(), LocalDate.now().plusDays(30),
                List.of(InvoiceFixtures.line("Item", 1, "100.00")), BigDecimal.ZERO)
        ).isInstanceOf(InvoiceNotEditableException.class);
    }

    @Test
    void update_paid_throws_not_editable() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice paidInvoice = new Invoice(
            id, "INV-2026-0002", clientId,
            LocalDate.now(), LocalDate.now().plusDays(30),
            List.of(InvoiceFixtures.line("Item", 1, "100.00")),
            BigDecimal.ZERO, InvoiceStatus.PAID,
            null, Instant.now(), Instant.now(), null, null,
            null, null, null, null, null, null, null, null
        );

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(paidInvoice));

        assertThatThrownBy(() ->
            service.update(id, "INV-2026-0002", clientId,
                LocalDate.now(), LocalDate.now().plusDays(30),
                List.of(InvoiceFixtures.line("Item", 1, "100.00")), BigDecimal.ZERO)
        ).isInstanceOf(InvoiceNotEditableException.class);
    }

    @Test
    void update_throws_not_found_when_invoice_missing() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            service.update(id, "INV-2026-0003", clientId,
                LocalDate.now(), LocalDate.now().plusDays(30),
                List.of(InvoiceFixtures.line("Item", 1, "10.00")), BigDecimal.ZERO)
        ).isInstanceOf(InvoiceNotFoundException.class);
    }

    @Test
    void update_throws_client_not_found_when_client_deleted() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice existing = InvoiceFixtures.invoice(id, clientId);

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(existing));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            service.update(id, existing.number(), clientId,
                existing.issueDate(), existing.dueDate(),
                existing.lines(), existing.taxRate())
        ).isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void update_with_null_number_keeps_existing_number() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice existing = InvoiceFixtures.invoice(id, clientId);

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(existing));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "acme@example.com")));
        when(invoiceRepository.update(any())).thenAnswer(inv -> inv.getArgument(0));

        // number=null → resolvedNumber = existing.number()
        Invoice result = service.update(id, null, clientId,
            existing.issueDate(), existing.dueDate(), existing.lines(), existing.taxRate());

        assertThat(result.number()).isEqualTo(existing.number());
    }

    @Test
    void update_with_blank_number_keeps_existing_number() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice existing = InvoiceFixtures.invoice(id, clientId);

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(existing));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "acme@example.com")));
        when(invoiceRepository.update(any())).thenAnswer(inv -> inv.getArgument(0));

        // number="  " → resolvedNumber = existing.number()
        Invoice result = service.update(id, "  ", clientId,
            existing.issueDate(), existing.dueDate(), existing.lines(), existing.taxRate());

        assertThat(result.number()).isEqualTo(existing.number());
    }

    @Test
    void update_throws_number_taken_when_new_number_conflicts() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice existing = InvoiceFixtures.invoice(id, clientId);
        String conflictingNumber = "INV-2026-9999";

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(existing));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "acme@example.com")));
        // The new number is different from existing AND already taken
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(conflictingNumber))
            .thenReturn(true);

        assertThatThrownBy(() ->
            service.update(id, conflictingNumber, clientId,
                existing.issueDate(), existing.dueDate(), existing.lines(), existing.taxRate())
        ).isInstanceOf(InvoiceNumberTakenException.class);
    }

    @Test
    void update_succeeds_when_new_number_is_unique() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice existing = InvoiceFixtures.invoice(id, clientId);
        String newNumber = "INV-2026-8888";

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(existing));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(InvoiceFixtures.client(clientId, "Acme", "acme@example.com")));
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull(newNumber))
            .thenReturn(false);
        when(invoiceRepository.update(any())).thenAnswer(inv -> inv.getArgument(0));

        Invoice result = service.update(id, newNumber, clientId,
            existing.issueDate(), existing.dueDate(), existing.lines(), existing.taxRate());

        assertThat(result.number()).isEqualTo(newNumber);
    }
}
