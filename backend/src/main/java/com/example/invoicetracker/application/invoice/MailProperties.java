package com.example.invoicetracker.application.invoice;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for invoice email delivery.
 * Subject and body templates support {{number}} and {{company}} placeholders.
 */
@ConfigurationProperties("app.mail")
public record MailProperties(
    String from,
    String subjectTemplate,
    String bodyTemplate
) {}
