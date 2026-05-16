package com.example.invoicetracker.application.invoice;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/**
 * Unit tests for {@link CompanyProperties} canonical constructor null-normalisation.
 */
class CompanyPropertiesTest {

    @Test
    void normalises_all_null_fields_to_empty_strings() {
        CompanyProperties props = new CompanyProperties(
            null, null, null, null, null, null, null, null);

        assertThat(props.name()).isEqualTo("");
        assertThat(props.address()).isEqualTo("");
        assertThat(props.email()).isEqualTo("");
        assertThat(props.taxId()).isEqualTo("");
        assertThat(props.vatNumber()).isEqualTo("");
        assertThat(props.iban()).isEqualTo("");
        assertThat(props.swiftBic()).isEqualTo("");
        assertThat(props.bankName()).isEqualTo("");
    }

    @Test
    void retains_non_null_values() {
        CompanyProperties props = new CompanyProperties(
            "Acme", "123 St", "acme@example.com", "TAX-001",
            "VAT-001", "IBAN-001", "SWIFT01", "Test Bank");

        assertThat(props.name()).isEqualTo("Acme");
        assertThat(props.address()).isEqualTo("123 St");
        assertThat(props.email()).isEqualTo("acme@example.com");
        assertThat(props.taxId()).isEqualTo("TAX-001");
        assertThat(props.vatNumber()).isEqualTo("VAT-001");
        assertThat(props.iban()).isEqualTo("IBAN-001");
        assertThat(props.swiftBic()).isEqualTo("SWIFT01");
        assertThat(props.bankName()).isEqualTo("Test Bank");
    }
}
