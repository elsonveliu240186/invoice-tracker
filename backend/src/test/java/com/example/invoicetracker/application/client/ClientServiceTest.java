package com.example.invoicetracker.application.client;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientEmailTakenException;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import com.example.invoicetracker.domain.client.ClientRepository;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
class ClientServiceTest {

    @Mock
    private ClientRepository clientRepository;

    private ClientService clientService;

    @BeforeEach
    void setUp() {
        clientService = new ClientService(clientRepository);
    }

    @Test
    void create_returns_persisted_client_with_timestamps() {
        ClientCommand.Create cmd = new ClientCommand.Create(
            "Acme Corp", "acme@example.com", "+1 555-0100", "123 Main St",
            null, null, null, null, null, null
        );
        when(clientRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("acme@example.com"))
            .thenReturn(false);
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        Client result = clientService.create(cmd);

        assertThat(result.id()).isNotNull();
        assertThat(result.createdAt()).isNotNull();
        assertThat(result.updatedAt()).isNotNull();
        assertThat(result.deletedAt()).isNull();
        assertThat(result.name()).isEqualTo("Acme Corp");

        verify(clientRepository).save(any(Client.class));
    }

    @Test
    void create_throws_when_email_already_taken() {
        ClientCommand.Create cmd = new ClientCommand.Create(
            "Dup Corp", "dup@example.com", null, null,
            null, null, null, null, null, null
        );
        when(clientRepository.existsByEmailIgnoreCaseAndDeletedAtIsNull("dup@example.com"))
            .thenReturn(true);

        assertThatThrownBy(() -> clientService.create(cmd))
            .isInstanceOf(ClientEmailTakenException.class);
    }

    @Test
    void update_throws_when_email_taken_by_other() {
        UUID id = UUID.randomUUID();
        Client existing = makeClient(id, "Old Name", "old@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(existing));
        when(clientRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot("new@example.com", id))
            .thenReturn(true);

        ClientCommand.Update cmd = new ClientCommand.Update(
            "New Name", "new@example.com", null, null,
            null, null, null, null, null, null);

        assertThatThrownBy(() -> clientService.update(id, cmd))
            .isInstanceOf(ClientEmailTakenException.class);
    }

    @Test
    void update_throws_when_client_not_found() {
        UUID id = UUID.randomUUID();
        when(clientRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

        ClientCommand.Update cmd = new ClientCommand.Update(
            "Name", "email@example.com", null, null,
            null, null, null, null, null, null);

        assertThatThrownBy(() -> clientService.update(id, cmd))
            .isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void update_with_new_non_conflicting_email_succeeds() {
        UUID id = UUID.randomUUID();
        Client existing = makeClient(id, "Old Name", "old@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(existing));
        when(clientRepository.existsByEmailIgnoreCaseAndDeletedAtIsNullAndIdNot("new@example.com", id))
            .thenReturn(false);
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        ClientCommand.Update cmd = new ClientCommand.Update(
            "New Name", "new@example.com", null, null,
            null, null, null, null, null, null);
        Client result = clientService.update(id, cmd);

        assertThat(result.email()).isEqualTo("new@example.com");
        assertThat(result.name()).isEqualTo("New Name");
    }

    @Test
    void update_allows_same_email_for_same_client() {
        UUID id = UUID.randomUUID();
        Client existing = makeClient(id, "Acme", "same@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(existing));
        when(clientRepository.save(any(Client.class))).thenAnswer(inv -> inv.getArgument(0));

        ClientCommand.Update cmd = new ClientCommand.Update(
            "Acme Updated", "same@example.com", null, null,
            null, null, null, null, null, null
        );
        Client result = clientService.update(id, cmd);

        assertThat(result.email()).isEqualTo("same@example.com");
        assertThat(result.name()).isEqualTo("Acme Updated");
    }

    @Test
    void delete_sets_deletedAt_and_persists() {
        UUID id = UUID.randomUUID();
        Client existing = makeClient(id, "Acme", "acme@example.com");
        when(clientRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.of(existing));

        ArgumentCaptor<Client> captor = ArgumentCaptor.forClass(Client.class);
        when(clientRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        clientService.delete(id);

        assertThat(captor.getValue().deletedAt()).isNotNull();
        verify(clientRepository).save(any(Client.class));
    }

    @Test
    void get_throws_when_not_found_or_deleted() {
        UUID id = UUID.randomUUID();
        when(clientRepository.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> clientService.get(id))
            .isInstanceOf(ClientNotFoundException.class);
    }

    @Test
    void list_passes_pageable_and_query_to_repo() {
        String query = "acme";
        Pageable pageable = PageRequest.of(0, 10);
        Page<Client> empty = new PageImpl<>(List.of(), pageable, 0);

        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        ArgumentCaptor<String> queryCaptor = ArgumentCaptor.forClass(String.class);
        when(clientRepository.findAllByDeletedAtIsNull(queryCaptor.capture(), pageableCaptor.capture()))
            .thenReturn(empty);

        clientService.list(query, pageable);

        assertThat(queryCaptor.getValue()).isEqualTo("acme");
        assertThat(pageableCaptor.getValue().getPageSize()).isEqualTo(10);
    }

    private Client makeClient(UUID id, String name, String email) {
        Instant now = Instant.now();
        return new Client(id, name, email, null, null, "", "", "", "", "", "", now, now, null);
    }
}
