package com.example.invoicetracker.application.invoice;

import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.Invoice;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

/**
 * Fallback {@link InvoiceMailer} implementation registered only when no other
 * {@link InvoiceMailer} bean is present (e.g. when FEAT-20260513-02 has not merged).
 *
 * <p>Never logs PII — the recipient address is logged only as a truncated SHA-256 hash.
 */
@Component
@ConditionalOnMissingBean(InvoiceMailer.class)
public class StandaloneInvoiceMailer implements InvoiceMailer {

    private static final Logger log = LoggerFactory.getLogger(StandaloneInvoiceMailer.class);

    private final JavaMailSender mailSender;
    private final MailProperties mailProperties;

    /**
     * Constructs the mailer.
     *
     * @param mailSender     the Spring mail sender
     * @param mailProperties the mail configuration properties
     */
    public StandaloneInvoiceMailer(JavaMailSender mailSender, MailProperties mailProperties) {
        this.mailSender = mailSender;
        this.mailProperties = mailProperties;
    }

    @Override
    public void send(Invoice invoice, String toEmail, byte[] pdfBytes,
                     CompanyProperties company, String clientName) {
        String emailHash = sha256Trunc8(toEmail);
        long start = System.currentTimeMillis();
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(mailProperties.from());
            helper.setTo(toEmail);
            helper.setSubject(buildSubject(invoice.number(), company.name()));

            String body = buildBody(invoice, company, clientName);
            helper.setText(body, false);

            String filename = "invoice-" + invoice.number() + ".pdf";
            helper.addAttachment(filename,
                () -> new java.io.ByteArrayInputStream(pdfBytes), "application/pdf");

            mailSender.send(message);

            long elapsed = System.currentTimeMillis() - start;
            log.info("Invoice {} sent to hash={} in {}ms", invoice.id(), emailHash, elapsed);

        } catch (MailException | MessagingException ex) {
            log.warn("Failed to send invoice {} to hash={}: {}", invoice.id(), emailHash,
                ex.getMessage());
            throw new EmailDeliveryFailedException(invoice.id().toString(), ex);
        }
    }

    private String buildSubject(String invoiceNumber, String companyName) {
        String template = mailProperties.subjectTemplate();
        if (template == null || template.isEmpty()) {
            return "Invoice #" + invoiceNumber + " from " + companyName;
        }
        return template
            .replace("{{number}}", invoiceNumber)
            .replace("{{company}}", companyName);
    }

    private String buildBody(Invoice invoice, CompanyProperties company, String clientName) {
        String template = mailProperties.bodyTemplate();
        if (template == null || template.isEmpty()) {
            return "Dear " + clientName + ",\n\n"
                + "Please find attached invoice #" + invoice.number()
                + " from " + company.name() + ".\n\n"
                + "Amount due: " + invoice.total() + "\n"
                + "Due date: " + invoice.dueDate() + "\n\n"
                + "Thank you for your business.\n\n"
                + company.name();
        }
        return template
            .replace("{{number}}", invoice.number())
            .replace("{{company}}", company.name())
            .replace("{{clientName}}", clientName)
            .replace("{{total}}", invoice.total().toPlainString())
            .replace("{{dueDate}}", invoice.dueDate().toString());
    }

    private String sha256Trunc8(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash) {
                hex.append(String.format("%02x", b));
            }
            return hex.substring(0, 8);
        } catch (NoSuchAlgorithmException e) {
            return "unknown";
        }
    }
}
