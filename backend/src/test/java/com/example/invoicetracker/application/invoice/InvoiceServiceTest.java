package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.Invoice;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceLine;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

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

    private CompanyProperties company;
    private InvoiceService service;

    @BeforeEach
    void setUp() {
        company = InvoiceFixtures.company();
        service = new InvoiceService(
            invoiceRepository, clientRepository, pdfRenderer, mailer, company, artifactService);
    }

    @Test
    void create_persists_and_returns_invoice() {
        UUID clientId = UUID.randomUUID();
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(client));
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull("INV-001"))
            .thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        List<InvoiceLine> lines = List.of(InvoiceFixtures.line("Widget", 3, "10.00"));
        Invoice result = service.create("INV-001", clientId,
            LocalDate.now(), LocalDate.now().plusDays(30), lines, new BigDecimal("0.10"));

        assertThat(result.number()).isEqualTo("INV-001");
        assertThat(result.lines()).hasSize(1);
        assertThat(result.total()).isEqualByComparingTo("33.00");
        verify(invoiceRepository).save(any(Invoice.class));
    }

    @Test
    void create_throws_when_client_not_found() {
        UUID clientId = UUID.randomUUID();
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
            service.create("INV-001", clientId, LocalDate.now(), LocalDate.now().plusDays(1),
                List.of(InvoiceFixtures.line("X", 1, "1.00")), BigDecimal.ZERO)
        ).isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void create_throws_when_number_already_taken() {
        UUID clientId = UUID.randomUUID();
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(client));
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull("INV-001"))
            .thenReturn(true);

        assertThatThrownBy(() ->
            service.create("INV-001", clientId, LocalDate.now(), LocalDate.now().plusDays(1),
                List.of(InvoiceFixtures.line("X", 1, "1.00")), BigDecimal.ZERO)
        ).isInstanceOf(InvoiceNumberTakenException.class);
    }

    @Test
    void get_returns_invoice_when_found() {
        UUID id = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, UUID.randomUUID());
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));

        Invoice result = service.get(id);

        assertThat(result.id()).isEqualTo(id);
    }

    @Test
    void get_throws_NotFound_for_unknown_id() {
        UUID id = UUID.randomUUID();
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.get(id))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    @Test
    void get_returns_null_client_email_when_client_deleted() {
        // Cover: clientRepository.findByIdAndDeletedAtIsNull returns empty → orElse(null)
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.empty());

        Invoice result = service.get(id);

        assertThat(result.id()).isEqualTo(id);
        assertThat(result.clientEmail()).isNull();
    }

    @Test
    void sendEmail_throws_HasNoRecipient_when_client_email_null() {
        // Cover: toEmail == null branch
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client clientNullEmail = InvoiceFixtures.client(clientId, "No Email Corp", null);

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(clientNullEmail));

        assertThatThrownBy(() -> service.sendEmail(id))
            .isInstanceOf(InvoiceHasNoRecipientException.class);

        verify(mailer, never()).send(any(), any(), any(), any(), any());
    }

    @Test
    void renderPdf_throws_when_client_not_found() {
        // Cover: clientRepository.findByIdAndDeletedAtIsNull returns empty in renderPdf
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.renderPdf(id))
            .isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void renderPdf_returns_nonempty_bytes() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        byte[] expectedBytes = new byte[2048];
        expectedBytes[0] = '%';
        expectedBytes[1] = 'P';
        expectedBytes[2] = 'D';
        expectedBytes[3] = 'F';

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.of(client));
        when(pdfRenderer.render(invoice, client, company)).thenReturn(expectedBytes);

        byte[] result = service.renderPdf(id);

        assertThat(result).hasSizeGreaterThanOrEqualTo(1024);
        verify(pdfRenderer).render(invoice, client, company);
    }

    @Test
    void renderPdf_throws_when_invoice_not_found() {
        UUID id = UUID.randomUUID();
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.renderPdf(id))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    @Test
    void sendEmail_marks_lastSentAt_on_success() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        byte[] pdfBytes = new byte[100];
        Instant sentAt = Instant.now();
        Invoice sentInvoice = new Invoice(
            invoice.id(), invoice.number(), invoice.clientId(),
            invoice.issueDate(), invoice.dueDate(), invoice.lines(),
            invoice.taxRate(), InvoiceStatus.SENT, sentAt, invoice.createdAt(),
            invoice.updatedAt(), null, null,
            null, null, null, null, null, null, null, null);

        when(invoiceRepository.findByIdWithLines(id))
            .thenReturn(Optional.of(invoice))
            .thenReturn(Optional.of(sentInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.of(client));
        when(pdfRenderer.render(eq(invoice), eq(client), any())).thenReturn(pdfBytes);
        when(invoiceRepository.markSent(eq(id), any(Instant.class))).thenReturn(sentInvoice);

        Invoice result = service.sendEmail(id);

        assertThat(result.lastSentAt()).isNotNull();
        verify(mailer).send(eq(invoice), eq("acme@example.com"), eq(pdfBytes), any(), eq("Acme"));
        verify(invoiceRepository).markSent(eq(id), any(Instant.class));
        verify(invoiceRepository).markSentIfDraft(id);
    }

    @Test
    void sendEmail_throws_EmailDeliveryFailed_on_MailSendException() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        byte[] pdfBytes = new byte[100];

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.of(client));
        when(pdfRenderer.render(any(), any(), any())).thenReturn(pdfBytes);
        org.mockito.Mockito.doThrow(new EmailDeliveryFailedException(id.toString(),
            new RuntimeException("SMTP down")))
            .when(mailer).send(any(), any(), any(), any(), any());

        assertThatThrownBy(() -> service.sendEmail(id))
            .isInstanceOf(EmailDeliveryFailedException.class);

        verify(invoiceRepository, never()).markSent(any(), any());
    }

    @Test
    void sendEmail_throws_HasNoRecipient_when_client_email_blank() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        // Client with blank email
        Client clientNoEmail = InvoiceFixtures.client(clientId, "No Email Corp", "");

        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(clientNoEmail));

        assertThatThrownBy(() -> service.sendEmail(id))
            .isInstanceOf(InvoiceHasNoRecipientException.class);

        verify(mailer, never()).send(any(), any(), any(), any(), any());
        verify(invoiceRepository, never()).markSent(any(), any());
    }

    @Test
    void list_delegates_to_repository() {
        UUID clientId = UUID.randomUUID();
        org.springframework.data.domain.Pageable pageable =
            org.springframework.data.domain.PageRequest.of(0, 10);
        org.springframework.data.domain.Page<Invoice> emptyPage =
            new org.springframework.data.domain.PageImpl<>(List.of());
        when(invoiceRepository.findAll(clientId, pageable)).thenReturn(emptyPage);

        org.springframework.data.domain.Page<Invoice> result = service.list(clientId, pageable);
        assertThat(result.getContent()).isEmpty();
        verify(invoiceRepository).findAll(clientId, pageable);
    }

    @Test
    void sendEmail_throws_HasNoRecipient_when_email_contains_carriage_return() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client crClient = InvoiceFixtures.client(clientId, "CR Corp", "bad\remail@example.com");
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(crClient));

        assertThatThrownBy(() -> service.sendEmail(id))
            .isInstanceOf(InvoiceHasNoRecipientException.class);
        verify(mailer, never()).send(any(), any(), any(), any(), any());
    }

    @Test
    void sendEmail_throws_HasNoRecipient_when_email_contains_newline() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client lfClient = InvoiceFixtures.client(clientId, "LF Corp", "bad\nemail@example.com");
        when(invoiceRepository.findByIdWithLines(id)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(lfClient));

        assertThatThrownBy(() -> service.sendEmail(id))
            .isInstanceOf(InvoiceHasNoRecipientException.class);
        verify(mailer, never()).send(any(), any(), any(), any(), any());
    }

    @Test
    void create_captor_verifies_line_items() {
        UUID clientId = UUID.randomUUID();
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(client));
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull("INV-999"))
            .thenReturn(false);

        ArgumentCaptor<Invoice> captor = ArgumentCaptor.forClass(Invoice.class);
        when(invoiceRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        List<InvoiceLine> lines = List.of(
            InvoiceFixtures.line("Item A", 2, "100.00"),
            InvoiceFixtures.line("Item B", 1, "50.00")
        );
        service.create("INV-999", clientId, LocalDate.now(), LocalDate.now().plusDays(30),
            lines, new BigDecimal("0.10"));

        Invoice saved = captor.getValue();
        assertThat(saved.lines()).hasSize(2);
        assertThat(saved.subtotal()).isEqualByComparingTo("250.00");
        assertThat(saved.total()).isEqualByComparingTo("275.00");
    }

    @Test
    void create_sets_draft_status() {
        UUID clientId = UUID.randomUUID();
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId))
            .thenReturn(Optional.of(client));
        when(invoiceRepository.existsByNumberIgnoreCaseAndDeletedAtIsNull("INV-STATUS"))
            .thenReturn(false);
        when(invoiceRepository.save(any(Invoice.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        Invoice result = service.create("INV-STATUS", clientId,
            LocalDate.now(), LocalDate.now().plusDays(30),
            List.of(InvoiceFixtures.line("Item", 1, "50.00")), BigDecimal.ZERO);

        assertThat(result.status()).isEqualTo(InvoiceStatus.DRAFT);
    }

    @Test
    void markAsPaid_delegates_to_repository() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice paidInvoice = new Invoice(
            id, "INV-PAID", clientId,
            java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(30),
            List.of(InvoiceFixtures.line("Item", 1, "100.00")),
            BigDecimal.ZERO, InvoiceStatus.PAID, null,
            java.time.Instant.now(), java.time.Instant.now(), null, null,
            null, null, null, null, null, null, null, null);

        when(invoiceRepository.markPaid(id)).thenReturn(paidInvoice);

        Invoice result = service.markAsPaid(id);

        assertThat(result.status()).isEqualTo(InvoiceStatus.PAID);
        verify(invoiceRepository).markPaid(id);
    }

    @Test
    void markAsPaid_throws_when_invoice_not_found() {
        UUID id = UUID.randomUUID();
        when(invoiceRepository.markPaid(id)).thenThrow(new InvoiceNotFoundException(id));

        assertThatThrownBy(() -> service.markAsPaid(id))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    @Test
<<<<<<< HEAD
    void sendEmail_uses_saved_pdf_when_present() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        byte[] savedBytes = new byte[]{1, 2, 3};
        Instant sentAt = Instant.now();
        Invoice sentInvoice = new Invoice(
            invoice.id(), invoice.number(), invoice.clientId(),
            invoice.issueDate(), invoice.dueDate(), invoice.lines(),
            invoice.taxRate(), com.example.invoicetracker.domain.invoice.InvoiceStatus.SENT,
            sentAt, invoice.createdAt(), invoice.updatedAt(), null, null);

        when(invoiceRepository.findByIdWithLines(id))
            .thenReturn(Optional.of(invoice))
            .thenReturn(Optional.of(sentInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.of(client));
        when(artifactService.findPdfBytes(id)).thenReturn(Optional.of(savedBytes));
        when(invoiceRepository.markSent(eq(id), any(Instant.class))).thenReturn(sentInvoice);

        service.sendEmail(id);

        // Saved bytes must be used — live renderer must NOT be called
        verify(pdfRenderer, never()).render(any(), any(), any());
        verify(artifactService).findPdfBytes(id);
        verify(mailer).send(eq(invoice), eq("acme@example.com"), eq(savedBytes), any(), eq("Acme"));
    }

    @Test
    void sendEmail_falls_back_to_live_render_when_no_saved() {
        UUID id = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        Invoice invoice = InvoiceFixtures.invoice(id, clientId);
        Client client = InvoiceFixtures.client(clientId, "Acme", "acme@example.com");
        byte[] liveBytes = new byte[]{4, 5, 6};
        Instant sentAt = Instant.now();
        Invoice sentInvoice = new Invoice(
            invoice.id(), invoice.number(), invoice.clientId(),
            invoice.issueDate(), invoice.dueDate(), invoice.lines(),
            invoice.taxRate(), com.example.invoicetracker.domain.invoice.InvoiceStatus.SENT,
            sentAt, invoice.createdAt(), invoice.updatedAt(), null, null);

        when(invoiceRepository.findByIdWithLines(id))
            .thenReturn(Optional.of(invoice))
            .thenReturn(Optional.of(sentInvoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.of(client));
        // No saved artefact — service falls back to live render
        when(artifactService.findPdfBytes(id)).thenReturn(Optional.empty());
        when(pdfRenderer.render(eq(invoice), eq(client), any())).thenReturn(liveBytes);
        when(invoiceRepository.markSent(eq(id), any(Instant.class))).thenReturn(sentInvoice);

        service.sendEmail(id);

        // Live renderer must be called because no saved bytes exist
        verify(pdfRenderer).render(eq(invoice), eq(client), any());
        verify(mailer).send(eq(invoice), eq("acme@example.com"), eq(liveBytes), any(), eq("Acme"));
    }

    @Test
    void deleteInvoice_calls_artifact_deleteAll_then_soft_deletes() {
=======
    void deleteInvoice_soft_deletes() {
>>>>>>> feat/FEAT-20260516-01-expense-tracking
        UUID id = UUID.randomUUID();

        service.deleteInvoice(id);

<<<<<<< HEAD
        verify(artifactService).deleteAll(id);
        verify(invoiceRepository).softDelete(id);
    }

    @Test
    void deleteInvoice_throws_when_invoice_not_found() {
        UUID id = UUID.randomUUID();
        org.mockito.Mockito.doThrow(new InvoiceNotFoundException(id))
            .when(invoiceRepository).softDelete(id);

        assertThatThrownBy(() -> service.deleteInvoice(id))
            .isInstanceOf(InvoiceNotFoundException.class);

        // artifactService.deleteAll is called first, softDelete propagates the exception
        verify(artifactService).deleteAll(id);
    }
=======
        verify(invoiceRepository).softDelete(id);
    }
>>>>>>> feat/FEAT-20260516-01-expense-tracking
}
