package com.example.invoicetracker.config;

import com.example.invoicetracker.application.invoice.CompanyProperties;
import com.example.invoicetracker.application.invoice.MailProperties;
import com.example.invoicetracker.application.template.InvoiceTemplateProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Enables binding of invoice-related configuration properties.
 */
@Configuration
@EnableConfigurationProperties({
    CompanyProperties.class,
    MailProperties.class,
    InvoiceTemplateProperties.class
})
public class InvoicePropertiesConfig {
}
