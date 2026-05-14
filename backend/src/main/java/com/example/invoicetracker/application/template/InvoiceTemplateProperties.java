package com.example.invoicetracker.application.template;

import java.nio.file.Path;
import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Configuration properties controlling invoice template storage and rendering.
 *
 * <ul>
 *   <li>{@code app.invoice.template-path} — filesystem path for the uploaded template
 *   <li>{@code app.invoice.max-template-bytes} — maximum accepted upload size (default 5 MiB)
 *   <li>{@code app.invoice.classpath-default} — classpath resource path for the bundled default
 *   <li>{@code app.invoice.locale} — IETF BCP 47 locale tag used for currency formatting
 *   <li>{@code app.invoice.currency} — ISO 4217 currency code; overrides the locale's default
 * </ul>
 */
@ConfigurationProperties("app.invoice")
public record InvoiceTemplateProperties(
    Path templatePath,
    long maxTemplateBytes,
    String classpathDefault,
    String locale,
    String currency
) {

    /**
     * Canonical constructor applying defaults for optional fields.
     */
    public InvoiceTemplateProperties {
        if (templatePath == null) {
            templatePath = Path.of("./templates/invoice-template.docx");
        }
        if (maxTemplateBytes <= 0) {
            maxTemplateBytes = 5_242_880L; // 5 MiB
        }
        if (classpathDefault == null || classpathDefault.isBlank()) {
            classpathDefault = "templates/invoice-template.docx";
        }
        if (locale == null || locale.isBlank()) {
            locale = "en-US";
        }
        if (currency == null || currency.isBlank()) {
            currency = "USD";
        }
    }
}
