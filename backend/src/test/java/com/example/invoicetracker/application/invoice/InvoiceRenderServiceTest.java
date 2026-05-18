package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.application.company.CompanyProfileResolver;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceRepository;
import com.example.invoicetracker.domain.invoice.PdfConversionFailedException;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link InvoiceRenderService}.
 */
@ExtendWith(MockitoExtension.class)
class InvoiceRenderServiceTest {

    @Mock
    InvoiceRepository invoiceRepository;

    @Mock
    ClientRepository clientRepository;

    @Mock
    InvoiceDocxRenderer docxRenderer;

    @Mock
    InvoicePdfRenderer pdfRenderer;

    @Mock
    InvoiceMailer mailer;

    @Mock
    InvoiceArtifactService artifactService;

    @Mock
    CompanyProfileResolver companyProfileResolver;

    InvoiceRenderService service;

    private UUID invoiceId;
    private UUID clientId;
    private Client sampleClient;

    @BeforeEach
    void setUp() {
        org.mockito.Mockito.lenient().when(companyProfileResolver.resolve())
            .thenReturn(InvoiceFixtures.company());
        service = new InvoiceRenderService(
            invoiceRepository, clientRepository, docxRenderer, pdfRenderer,
            mailer, companyProfileResolver, artifactService);
        invoiceId = UUID.randomUUID();
        clientId = UUID.randomUUID();
        sampleClient = InvoiceFixtures.client(clientId, "Acme Corp", "acme@example.com");
    }

    // ===== renderDocx =====

    @Test
    void renderDocx_returns_bytes() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(docxRenderer.render(any(), any(), any())).thenReturn("docx-bytes".getBytes());

        byte[] result = service.renderDocx(invoiceId);

        assertThat(result).isEqualTo("docx-bytes".getBytes());
        verify(docxRenderer).render(eq(invoice), eq(sampleClient), any());
    }

    @Test
    void renderDocx_throws_not_found_for_unknown_invoice() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.renderDocx(invoiceId))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    // ===== renderPdf =====

    @Test
    void renderPdf_returns_bytes() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(pdfRenderer.render(any(), any(), any())).thenReturn("%PDF-bytes".getBytes());

        byte[] result = service.renderPdf(invoiceId);

        assertThat(result).isEqualTo("%PDF-bytes".getBytes());
        verify(pdfRenderer).render(eq(invoice), eq(sampleClient), any());
    }

    @Test
    void renderPdf_throws_not_found_for_unknown_invoice() {
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.renderPdf(invoiceId))
            .isInstanceOf(InvoiceNotFoundException.class);
    }

    // ===== sendEmail =====

    @Test
    void sendEmail_writes_lastSentAt_on_success() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(pdfRenderer.render(any(), any(), any())).thenReturn("%PDF-bytes".getBytes());
        when(invoiceRepository.markSent(eq(invoiceId), any(Instant.class))).thenReturn(invoice);

        Instant result = service.sendEmail(invoiceId);

        assertThat(result).isNotNull();
        verify(mailer).send(eq(invoice), eq("acme@example.com"), any(), any(), any());
        verify(invoiceRepository).markSent(eq(invoiceId), any(Instant.class));
    }

    @Test
    void sendEmail_does_not_write_on_smtp_failure() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(pdfRenderer.render(any(), any(), any())).thenReturn("%PDF-bytes".getBytes());
        // send() is void — use doThrow
        org.mockito.Mockito.doThrow(new EmailDeliveryFailedException(invoiceId.toString(),
            new RuntimeException("SMTP down")))
            .when(mailer).send(any(), any(), any(), any(), any());

        assertThatThrownBy(() -> service.sendEmail(invoiceId))
            .isInstanceOf(EmailDeliveryFailedException.class);

        verify(invoiceRepository, never()).markSent(any(), any());
    }

    @Test
    void sendEmail_does_not_write_on_conversion_failure() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(pdfRenderer.render(any(), any(), any()))
            .thenThrow(new PdfConversionFailedException("LO failed"));

        assertThatThrownBy(() -> service.sendEmail(invoiceId))
            .isInstanceOf(PdfConversionFailedException.class);

        verify(mailer, never()).send(any(), any(), any(), any(), any());
        verify(invoiceRepository, never()).markSent(any(), any());
    }

    @Test
    void sendEmail_throws_when_client_email_blank() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        Client noEmailClient = InvoiceFixtures.client(clientId, "No Email Corp", "");
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(noEmailClient));

        assertThatThrownBy(() -> service.sendEmail(invoiceId))
            .isInstanceOf(InvoiceHasNoRecipientException.class);

        verify(mailer, never()).send(any(), any(), any(), any(), any());
        verify(invoiceRepository, never()).markSent(any(), any());
    }

    @Test
    void sendEmail_throws_when_client_email_null() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        Client nullEmailClient = InvoiceFixtures.client(clientId, "No Email Corp", null);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(nullEmailClient));

        assertThatThrownBy(() -> service.sendEmail(invoiceId))
            .isInstanceOf(InvoiceHasNoRecipientException.class);
    }

    @Test
    void sendEmail_throws_when_email_contains_carriage_return() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        // Email with CR — SMTP header injection guard
        Client crClient = InvoiceFixtures.client(clientId, "CR Corp", "bad\remail@example.com");
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(crClient));

        assertThatThrownBy(() -> service.sendEmail(invoiceId))
            .isInstanceOf(InvoiceHasNoRecipientException.class);

        verify(mailer, never()).send(any(), any(), any(), any(), any());
    }

    @Test
    void sendEmail_throws_when_email_contains_newline() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        // Email with LF — SMTP header injection guard
        Client lfClient = InvoiceFixtures.client(clientId, "LF Corp", "bad\nemail@example.com");
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(lfClient));

        assertThatThrownBy(() -> service.sendEmail(invoiceId))
            .isInstanceOf(InvoiceHasNoRecipientException.class);

        verify(mailer, never()).send(any(), any(), any(), any(), any());
    }

    @Test
    void docx_uses_resolved_company() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(
            Optional.of(sampleClient));
        when(docxRenderer.render(any(), any(), any())).thenReturn("docx".getBytes());

        // The resolver returns a non-YAML company name
        var resolvedCompany = new com.example.invoicetracker.application.invoice.CompanyProperties(
            "Resolved Corp", "1 Resolved St", "resolved@example.com",
            "", "", "", "", "");
        when(companyProfileResolver.resolve()).thenReturn(resolvedCompany);

        service.renderDocx(invoiceId);

        // Verify the renderer received the resolved company (not YAML defaults)
        verify(docxRenderer).render(eq(invoice), eq(sampleClient), eq(resolvedCompany));
    }

    @Test
    void renderDocx_throws_when_client_not_found() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.renderDocx(invoiceId))
            .isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void renderPdf_throws_when_client_not_found() {
        var invoice = InvoiceFixtures.invoice(invoiceId, clientId);
        when(invoiceRepository.findByIdWithLines(invoiceId)).thenReturn(Optional.of(invoice));
        when(clientRepository.findByIdAndDeletedAtIsNull(clientId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.renderPdf(invoiceId))
            .isInstanceOf(ClientNotFoundException.class);
    }
}
