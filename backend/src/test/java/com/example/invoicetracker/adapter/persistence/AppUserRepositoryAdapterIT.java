package com.example.invoicetracker.adapter.persistence;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.invoicetracker.domain.AppUser;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.dao.DataIntegrityViolationException;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest
@Testcontainers
class AppUserRepositoryAdapterIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    AppUserRepositoryAdapter adapter;

    @Autowired
    AppUserJpaRepository jpaRepository;

    private AppUser buildUser(String displayName, String email) {
        return new AppUser(UUID.randomUUID(), email, displayName, "hash", Instant.now());
    }

    @Test
    void persists_and_finds_by_email() {
        AppUser user = buildUser("Alice", "alice-it@example.com");
        adapter.save(user);

        Optional<AppUser> found = adapter.findByEmail("alice-it@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().email()).isEqualTo("alice-it@example.com");
        assertThat(found.get().displayName()).isEqualTo("Alice");
    }

    @Test
    void find_by_email_is_case_insensitive() {
        AppUser user = buildUser("Bob", "BOB-IT@EXAMPLE.COM");
        adapter.save(user);

        Optional<AppUser> found = adapter.findByEmail("bob-it@example.com");

        assertThat(found).isPresent();
        assertThat(found.get().displayName()).isEqualTo("Bob");
    }

    @Test
    void existsByEmail_returns_true_when_present() {
        AppUser user = buildUser("Carol", "carol-it@example.com");
        adapter.save(user);

        assertThat(adapter.existsByEmail("carol-it@example.com")).isTrue();
    }

    @Test
    void existsByEmail_returns_false_when_absent() {
        assertThat(adapter.existsByEmail("nobody-" + UUID.randomUUID() + "@example.com")).isFalse();
    }

    @Test
    void partial_unique_index_blocks_duplicate_active() {
        AppUser first = buildUser("Dave", "dave-dup-it@example.com");
        adapter.save(first);

        AppUser second = buildUser("Dave2", "Dave-Dup-IT@example.com");

        assertThatThrownBy(() -> {
            adapter.save(second);
            jpaRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}
