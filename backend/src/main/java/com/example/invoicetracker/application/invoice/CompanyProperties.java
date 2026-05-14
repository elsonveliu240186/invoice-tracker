package com.example.invoicetracker.application.invoice;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties for the company shown on invoices and emails.
 */
@ConfigurationProperties("app.company")
public record CompanyProperties(
    String name,
    String address,
    String email,
    String taxId
) {}
