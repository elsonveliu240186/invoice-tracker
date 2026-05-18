package com.example.invoicetracker.application.company;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
 * Unit tests for {@link CompanyProfileService}.
 */
@ExtendWith(MockitoExtension.class)
class CompanyProfileServiceTest {

    @Mock
    CompanyProfileRepository repository;

    CompanyProfileService service;

    @BeforeEach
    void setUp() {
        service = new CompanyProfileService(repository);
    }

    @Test
    void get_returns_seed_row_when_blank() {
        when(repository.find()).thenReturn(Optional.empty());

        CompanyProfile result = service.get();

        assertThat(result).isNotNull();
        assertThat(result.name()).isEqualTo("");
        assertThat(result.address()).isEqualTo("");
        assertThat(result.email()).isEqualTo("");
        assertThat(result.updatedAt()).isNotNull();
    }

    @Test
    void get_returns_persisted_profile_when_present() {
        CompanyProfile profile = new CompanyProfile(
            "Acme Corp", "123 Street", "+1 555", "acme@example.com",
            "VAT001", "IBAN001", "SWIFT01", "Test Bank", Instant.now());
        when(repository.find()).thenReturn(Optional.of(profile));

        CompanyProfile result = service.get();

        assertThat(result.name()).isEqualTo("Acme Corp");
        assertThat(result.email()).isEqualTo("acme@example.com");
    }

    @Test
    void update_persists_and_bumps_updatedAt() {
        CompanyProfile toSave = new CompanyProfile(
            "New Corp", "456 Ave", "+1 777", "new@example.com",
            "VAT002", "IBAN002", "SWIFT02", "New Bank", Instant.now());
        when(repository.save(any(CompanyProfile.class))).thenReturn(toSave);

        CompanyProfile saved = service.update(toSave);

        verify(repository).save(toSave);
        assertThat(saved.name()).isEqualTo("New Corp");
        assertThat(saved.updatedAt()).isNotNull();
    }
}
