package com.example.invoicetracker.application.template;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.file.Path;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link InvoiceTemplateProperties} canonical constructor defaults.
 */
class InvoiceTemplatePropertiesTest {

    @Test
    void uses_defaults_when_all_fields_null_or_zero() {
        // Cover: templatePath == null, maxTemplateBytes <= 0, classpathDefault == null,
        //        locale == null, currency == null → all default branches
        InvoiceTemplateProperties props = new InvoiceTemplateProperties(
            null, 0L, null, null, null);

        assertThat(props.templatePath()).isEqualTo(
            Path.of("./templates/invoice-template.docx"));
        assertThat(props.maxTemplateBytes()).isEqualTo(5_242_880L);
        assertThat(props.classpathDefault()).isEqualTo("templates/invoice-template.docx");
        assertThat(props.locale()).isEqualTo("en-US");
        assertThat(props.currency()).isEqualTo("USD");
    }

    @Test
    void uses_defaults_when_strings_are_blank() {
        // Cover: classpathDefault.isBlank(), locale.isBlank(), currency.isBlank()
        InvoiceTemplateProperties props = new InvoiceTemplateProperties(
            Path.of("./custom.docx"), -1L, "   ", "  ", "  ");

        assertThat(props.templatePath()).isEqualTo(Path.of("./custom.docx"));
        assertThat(props.maxTemplateBytes()).isEqualTo(5_242_880L);
        assertThat(props.classpathDefault()).isEqualTo("templates/invoice-template.docx");
        assertThat(props.locale()).isEqualTo("en-US");
        assertThat(props.currency()).isEqualTo("USD");
    }

    @Test
    void retains_explicit_non_null_values() {
        // Cover: all non-null provided → no default substitution
        InvoiceTemplateProperties props = new InvoiceTemplateProperties(
            Path.of("./my-template.docx"),
            10_000_000L,
            "custom/template.docx",
            "de-DE",
            "EUR"
        );

        assertThat(props.templatePath()).isEqualTo(Path.of("./my-template.docx"));
        assertThat(props.maxTemplateBytes()).isEqualTo(10_000_000L);
        assertThat(props.classpathDefault()).isEqualTo("custom/template.docx");
        assertThat(props.locale()).isEqualTo("de-DE");
        assertThat(props.currency()).isEqualTo("EUR");
    }
}
