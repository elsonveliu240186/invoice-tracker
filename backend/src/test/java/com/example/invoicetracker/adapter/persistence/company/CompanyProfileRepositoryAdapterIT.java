package com.example.invoicetracker.adapter.persistence.company;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.domain.company.CompanyProfile;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Integration test for {@link CompanyProfileRepositoryAdapter}.
 */
@SpringBootTest
@Testcontainers
class CompanyProfileRepositoryAdapterIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    CompanyProfileRepositoryAdapter adapter;

    @Autowired
    CompanyProfileJpaRepository jpaRepository;

    private CompanyProfile buildProfile(String name) {
        return new CompanyProfile(name, "456 Avenue", "+44 1234",
            "corp@example.com", "VAT123", "GB00NWBK60161331926819",
            "NWBKGB2L", "NatWest Bank", Instant.now());
    }

    @Test
    void find_returns_seeded_row() {
        Optional<CompanyProfile> found = adapter.find();
        assertThat(found).isPresent();
        // Seeded row has blank name
        assertThat(found.get().name()).isEqualTo("");
    }

    @Test
    void save_then_find_round_trip() {
        CompanyProfile profile = buildProfile("Round Trip Corp");
        adapter.save(profile);

        Optional<CompanyProfile> found = adapter.find();

        assertThat(found).isPresent();
        assertThat(found.get().name()).isEqualTo("Round Trip Corp");
    }

    @Test
    void upserts_singleton_row() {
        // First save
        adapter.save(buildProfile("First Save Corp"));

        // Second save overwrites first
        adapter.save(buildProfile("Second Save Corp"));

        // Still one row
        long rowCount = jpaRepository.count();
        assertThat(rowCount).isEqualTo(1L);

        // Latest value wins
        Optional<CompanyProfile> found = adapter.find();
        assertThat(found).isPresent();
        assertThat(found.get().name()).isEqualTo("Second Save Corp");
    }

    @Test
    void save_persists_all_fields() {
        CompanyProfile profile = new CompanyProfile(
            "Full Corp", "999 Full St", "+1 999-9999",
            "full@example.com", "VAT999",
            "DE89370400440532013000", "COBADEFFXXX", "Commerzbank",
            Instant.now()
        );
        adapter.save(profile);

        Optional<CompanyProfile> found = adapter.find();
        assertThat(found).isPresent();
        CompanyProfile saved = found.get();
        assertThat(saved.name()).isEqualTo("Full Corp");
        assertThat(saved.address()).isEqualTo("999 Full St");
        assertThat(saved.phone()).isEqualTo("+1 999-9999");
        assertThat(saved.email()).isEqualTo("full@example.com");
        assertThat(saved.vatNumber()).isEqualTo("VAT999");
        assertThat(saved.iban()).isEqualTo("DE89370400440532013000");
        assertThat(saved.swiftBic()).isEqualTo("COBADEFFXXX");
        assertThat(saved.bankName()).isEqualTo("Commerzbank");
        assertThat(saved.updatedAt()).isNotNull();
    }
}
