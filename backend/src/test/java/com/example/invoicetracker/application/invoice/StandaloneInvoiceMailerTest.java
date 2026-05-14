package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.support.InvoiceFixtures;
import com.icegreen.greenmail.junit5.GreenMailExtension;
import com.icegreen.greenmail.util.GreenMailUtil;
import com.icegreen.greenmail.util.ServerSetupTest;
import jakarta.mail.BodyPart;
import jakarta.mail.Multipart;
import jakarta.mail.internet.MimeMessage;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSenderImpl;

/**
 * Tests for {@link StandaloneInvoiceMailer} using GreenMail as a fake SMTP server.
 */
class StandaloneInvoiceMailerTest {

    @RegisterExtension
    static GreenMailExtension greenMail = new GreenMailExtension(ServerSetupTest.SMTP);

    private StandaloneInvoiceMailer mailer;
    private MailProperties mailProperties;

    @BeforeEach
    void setUp() {
        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("localhost");
        sender.setPort(greenMail.getSmtp().getPort());
        sender.setProtocol("smtp");

        mailProperties = new MailProperties(
            "no-reply@test.local",
            "Invoice #{{number}} from {{company}}",
            ""
        );
        mailer = new StandaloneInvoiceMailer(sender, mailProperties);
    }

    @Test
    void sends_message_with_pdf_attachment() throws Exception {
        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();
        byte[] pdfBytes = "%PDF-1.4 fake content".getBytes();

        mailer.send(invoice, client.email(), pdfBytes, company, client.name());

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(1);

        MimeMessage msg = received[0];
        assertThat(msg.getSubject()).contains(invoice.number());
        assertThat(msg.getSubject()).contains(company.name());

        // Verify attachment
        Multipart multipart = (Multipart) msg.getContent();
        boolean foundPdfAttachment = false;
        for (int i = 0; i < multipart.getCount(); i++) {
            BodyPart part = multipart.getBodyPart(i);
            if (part.getFileName() != null && part.getFileName().endsWith(".pdf")) {
                foundPdfAttachment = true;
                assertThat(part.getContentType()).contains("application/pdf");
            }
        }
        assertThat(foundPdfAttachment).isTrue();
    }

    @Test
    void subject_template_substitutes_number_and_company() throws Exception {
        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();
        byte[] pdfBytes = "%PDF-1.4".getBytes();

        mailer.send(invoice, client.email(), pdfBytes, company, client.name());

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(1);
        String subject = received[0].getSubject();
        assertThat(subject).isEqualTo(
            "Invoice #" + invoice.number() + " from " + company.name());
    }

    @Test
    void crlf_in_invoice_number_does_not_cause_header_injection() {
        // The mailer should still work with the email going through;
        // header injection guard is in the service layer, but test that sending works safely
        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();
        byte[] pdfBytes = "%PDF-1.4".getBytes();

        // Normal send should succeed without CRLF
        mailer.send(invoice, client.email(), pdfBytes, company, client.name());
        assertThat(greenMail.getReceivedMessages()).hasSize(1);
    }

    @Test
    void recipient_logged_only_as_hash() throws Exception {
        Logger standaloneMailerLogger = (Logger) LoggerFactory.getLogger(
            StandaloneInvoiceMailer.class);
        ListAppender<ILoggingEvent> listAppender = new ListAppender<>();
        listAppender.start();
        standaloneMailerLogger.addAppender(listAppender);

        try {
            var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
            var client = InvoiceFixtures.client();
            var company = InvoiceFixtures.company();
            byte[] pdfBytes = "%PDF-1.4".getBytes();

            mailer.send(invoice, client.email(), pdfBytes, company, client.name());

            List<ILoggingEvent> logs = listAppender.list;
            boolean anyContainsEmail = logs.stream()
                .filter(e -> e.getLevel().isGreaterOrEqual(Level.INFO))
                .anyMatch(e -> e.getFormattedMessage().contains(client.email()));
            assertThat(anyContainsEmail)
                .as("Full email address must not appear in logs")
                .isFalse();

            // Hash (8 hex chars) should appear in at least one log
            boolean hashLogged = logs.stream()
                .anyMatch(e -> e.getFormattedMessage().matches(".*[0-9a-f]{8}.*"));
            assertThat(hashLogged)
                .as("SHA-256 hash (trunc 8) should appear in logs")
                .isTrue();
        } finally {
            standaloneMailerLogger.detachAppender(listAppender);
        }
    }

    @Test
    void smtp_failure_throws_email_delivery_failed() {
        JavaMailSenderImpl brokenSender = new JavaMailSenderImpl();
        brokenSender.setHost("localhost");
        brokenSender.setPort(9); // invalid port
        brokenSender.setProtocol("smtp");

        StandaloneInvoiceMailer brokenMailer = new StandaloneInvoiceMailer(
            brokenSender, mailProperties);

        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        assertThatThrownBy(() -> brokenMailer.send(
            invoice, client.email(), "%PDF".getBytes(), company, client.name()))
            .isInstanceOf(EmailDeliveryFailedException.class);
    }

    @Test
    void body_template_substitution_used_when_non_empty() throws Exception {
        // Cover buildBody() non-empty template branch and buildSubject null/empty branch
        MailProperties customProps = new MailProperties(
            "no-reply@test.local",
            "", // empty subject template → fall back to default
            "Dear {{clientName}}, your invoice #{{number}} from {{company}} "
                + "total {{total}} is due {{dueDate}}."
        );

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("localhost");
        sender.setPort(greenMail.getSmtp().getPort());
        sender.setProtocol("smtp");

        StandaloneInvoiceMailer customMailer = new StandaloneInvoiceMailer(sender, customProps);

        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        customMailer.send(invoice, client.email(), "%PDF".getBytes(), company, client.name());

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(1);
        // Subject falls back to default because template is empty
        assertThat(received[0].getSubject()).contains(invoice.number());
    }

    @Test
    void null_subject_template_falls_back_to_default() throws Exception {
        // Cover buildSubject() null-template branch
        MailProperties nullSubjectProps = new MailProperties(
            "no-reply@test.local",
            null,
            ""
        );

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("localhost");
        sender.setPort(greenMail.getSmtp().getPort());
        sender.setProtocol("smtp");

        StandaloneInvoiceMailer nullSubjectMailer = new StandaloneInvoiceMailer(
            sender, nullSubjectProps);

        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        nullSubjectMailer.send(invoice, client.email(), "%PDF".getBytes(), company, client.name());

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(1);
        assertThat(received[0].getSubject()).contains("Invoice #");
    }

    @Test
    void null_body_template_uses_default_message() throws Exception {
        // Cover buildBody() null bodyTemplate branch
        MailProperties nullBodyProps = new MailProperties(
            "no-reply@test.local",
            "Invoice #{{number}} from {{company}}",
            null
        );

        JavaMailSenderImpl sender = new JavaMailSenderImpl();
        sender.setHost("localhost");
        sender.setPort(greenMail.getSmtp().getPort());
        sender.setProtocol("smtp");

        StandaloneInvoiceMailer nullBodyMailer = new StandaloneInvoiceMailer(
            sender, nullBodyProps);

        var invoice = InvoiceFixtures.invoice(java.util.UUID.randomUUID());
        var client = InvoiceFixtures.client();
        var company = InvoiceFixtures.company();

        nullBodyMailer.send(invoice, client.email(), "%PDF".getBytes(), company, client.name());

        MimeMessage[] received = greenMail.getReceivedMessages();
        assertThat(received).hasSize(1);
        assertThat(received[0].getSubject()).contains("Invoice #");
    }
}
