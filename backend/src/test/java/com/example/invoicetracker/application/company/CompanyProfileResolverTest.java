package com.example.invoicetracker.application.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.application.invoice.CompanyProperties;
import com.example.invoicetracker.domain.company.CompanyProfile;
import com.example.invoicetracker.domain.company.CompanyProfileRepository;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for {@link CompanyProfileResolver}.
 */
@ExtendWith(MockitoExtension.class)
class CompanyProfileResolverTest {

    @Mock
    CompanyProfileRepository repository;

    CompanyProfileResolver resolver;

    private CompanyProperties yaml;

    @BeforeEach
    void setUp() {
        yaml = new CompanyProperties(
            "YAML Corp",
            "YAML Address",
            "yaml@example.com",
            "YAML-TAX",
            "YAML-VAT",
            "YAML-IBAN",
            "YAML-SWIFT",
            "YAML Bank"
        );
        resolver = new CompanyProfileResolver(repository, yaml);
    }

    @Test
    void persisted_overrides_yaml() {
        CompanyProfile profile = new CompanyProfile(
            "Persisted Corp", "123 Persisted St", "+1 555", "persisted@example.com",
            "PVAR", "PIBAN", "PSWIFT", "Persisted Bank", Instant.now());
        when(repository.find()).thenReturn(Optional.of(profile));

        CompanyProperties result = resolver.resolve();

        assertThat(result.name()).isEqualTo("Persisted Corp");
        assertThat(result.address()).isEqualTo("123 Persisted St");
        assertThat(result.email()).isEqualTo("persisted@example.com");
        assertThat(result.iban()).isEqualTo("PIBAN");
        assertThat(result.swiftBic()).isEqualTo("PSWIFT");
        assertThat(result.bankName()).isEqualTo("Persisted Bank");
    }

    @Test
    void falls_back_to_yaml_when_persisted_blank() {
        CompanyProfile blankProfile = new CompanyProfile(
            "", "", "", "", "", "", "", "", Instant.now());
        when(repository.find()).thenReturn(Optional.of(blankProfile));

        CompanyProperties result = resolver.resolve();

        assertThat(result.name()).isEqualTo("YAML Corp");
        assertThat(result.address()).isEqualTo("YAML Address");
        assertThat(result.email()).isEqualTo("yaml@example.com");
        assertThat(result.iban()).isEqualTo("YAML-IBAN");
    }

    @Test
    void falls_back_to_yaml_when_no_persisted_row() {
        when(repository.find()).thenReturn(Optional.empty());

        CompanyProperties result = resolver.resolve();

        assertThat(result.name()).isEqualTo("YAML Corp");
        assertThat(result.email()).isEqualTo("yaml@example.com");
    }

    @Test
    void partial_persisted_overrides_individual_yaml_fields() {
        CompanyProfile partial = new CompanyProfile(
            "Partial Corp", "", "", "", "", "", "", "", Instant.now());
        when(repository.find()).thenReturn(Optional.of(partial));

        CompanyProperties result = resolver.resolve();

        assertThat(result.name()).isEqualTo("Partial Corp");
        assertThat(result.address()).isEqualTo("YAML Address");
        assertThat(result.email()).isEqualTo("yaml@example.com");
    }

    @Test
    void resolve_profile_includes_phone_from_persisted() {
        CompanyProfile profile = new CompanyProfile(
            "Corp X", "Addr X", "+44 1234", "x@example.com",
            "VAT-X", "IBAN-X", "SWIFT-X", "Bank X", Instant.now());
        when(repository.find()).thenReturn(Optional.of(profile));

        CompanyProfile result = resolver.resolveProfile();

        assertThat(result.name()).isEqualTo("Corp X");
        assertThat(result.phone()).isEqualTo("+44 1234");
    }

    @Test
    void resolve_profile_returns_defaults_when_no_row() {
        when(repository.find()).thenReturn(Optional.empty());

        CompanyProfile result = resolver.resolveProfile();

        assertThat(result.name()).isEqualTo("YAML Corp");
        assertThat(result.phone()).isEqualTo("");
    }
}
