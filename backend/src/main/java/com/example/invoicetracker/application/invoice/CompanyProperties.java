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
    String taxId,
    String vatNumber,
    String iban,
    String swiftBic,
    String bankName
) {
    /**
     * Normalises all null values to empty strings.
     */
    public CompanyProperties {
        name      = name      != null ? name      : "";
        address   = address   != null ? address   : "";
        email     = email     != null ? email     : "";
        taxId     = taxId     != null ? taxId     : "";
        vatNumber = vatNumber != null ? vatNumber : "";
        iban      = iban      != null ? iban      : "";
        swiftBic  = swiftBic  != null ? swiftBic  : "";
        bankName  = bankName  != null ? bankName  : "";
    }
}
