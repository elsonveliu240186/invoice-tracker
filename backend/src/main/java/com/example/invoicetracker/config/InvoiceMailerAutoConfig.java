package com.example.invoicetracker.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

/**
 * Auto-configuration guard that ensures {@link org.springframework.mail.javamail.JavaMailSender}
 * infrastructure is only wired when {@code spring.mail.host} is configured.
 *
 * <p>This prevents unit tests for pure renderers from failing due to a missing SMTP context
 * when they run without the {@code spring.mail.*} properties.
 */
@Configuration
@ConditionalOnProperty(name = "spring.mail.host")
public class InvoiceMailerAutoConfig {
    // Spring Boot's MailSenderAutoConfiguration is already conditional on spring.mail.host.
    // This configuration class documents the intent and can be extended if needed.
}
