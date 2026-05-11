package com.example.invoicetracker.adapter.persistence.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.example.invoicetracker.domain.client.Client;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
@Testcontainers
@Import({ClientRepositoryAdapter.class, ClientEntityMapper.class})
class ClientRepositoryAdapterIT {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    ClientRepositoryAdapter adapter;

    @Autowired
    ClientJpaRepository jpaRepository;

    private Client buildClient(String name, String email) {
        Instant now = Instant.now();
        return new Client(UUID.randomUUID(), name, email, null, null, now, now, null);
    }

    @Test
    void save_then_find_round_trip() {
        Client client = buildClient("Acme Corp", "acme@example.com");
        Client saved = adapter.save(client);

        Optional<Client> found = adapter.findByIdAndDeletedAtIsNull(saved.id());

        assertThat(found).isPresent();
        assertThat(found.get().name()).isEqualTo("Acme Corp");
        assertThat(found.get().email()).isEqualTo("acme@example.com");
        assertThat(found.get().deletedAt()).isNull();
    }

    @Test
    void unique_email_constraint_blocks_duplicates() {
        Client first = buildClient("Acme A", "dup@example.com");
        adapter.save(first);

        Client second = buildClient("Acme B", "dup@example.com");

        assertThatThrownBy(() -> {
            adapter.save(second);
            jpaRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void soft_deleted_row_is_excluded_from_queries() {
        Client client = buildClient("Ghost Corp", "ghost@example.com");
        Client saved = adapter.save(client);

        Client softDeleted = new Client(
            saved.id(), saved.name(), saved.email(), saved.phone(), saved.address(),
            saved.createdAt(), saved.updatedAt(), Instant.now()
        );
        adapter.save(softDeleted);

        Optional<Client> byId = adapter.findByIdAndDeletedAtIsNull(saved.id());
        assertThat(byId).isEmpty();

        Page<Client> searchResult = adapter.findAllByDeletedAtIsNull(
            "ghost", PageRequest.of(0, 10));
        assertThat(searchResult.getContent()).isEmpty();
    }

    @Test
    void search_is_case_insensitive_on_name_and_email() {
        Client client = buildClient("Acme Industries", "contact@acmeindustries.com");
        adapter.save(client);

        Page<Client> byName = adapter.findAllByDeletedAtIsNull(
            "acm", PageRequest.of(0, 10));
        assertThat(byName.getContent()).hasSize(1);
        assertThat(byName.getContent().get(0).name()).isEqualTo("Acme Industries");

        Page<Client> byEmail = adapter.findAllByDeletedAtIsNull(
            "ACMEINDUSTRIES", PageRequest.of(0, 10));
        assertThat(byEmail.getContent()).hasSize(1);
    }

    @Test
    void pagination_returns_expected_slice() {
        List<Client> clients = new ArrayList<>();
        for (int i = 1; i <= 25; i++) {
            clients.add(buildClient("Client " + String.format("%02d", i),
                "client" + i + "@example.com"));
        }
        clients.forEach(adapter::save);

        PageRequest pageRequest = PageRequest.of(1, 10, Sort.by("name"));
        Page<Client> page = adapter.findAllByDeletedAtIsNull(null, pageRequest);

        assertThat(page.getTotalElements()).isGreaterThanOrEqualTo(25);
        assertThat(page.getContent()).hasSize(10);
        assertThat(page.getNumber()).isEqualTo(1);
    }
}
