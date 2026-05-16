package com.example.invoicetracker.adapter.web.client;

import com.example.invoicetracker.adapter.web.client.dto.ClientResponse;
import com.example.invoicetracker.adapter.web.client.dto.CreateClientRequest;
import com.example.invoicetracker.adapter.web.client.dto.PageResponse;
import com.example.invoicetracker.adapter.web.client.dto.UpdateClientRequest;
import com.example.invoicetracker.application.client.ClientCommand;
import com.example.invoicetracker.application.client.ClientService;
import com.example.invoicetracker.domain.client.Client;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

/**
 * REST controller for client management endpoints at /api/v1/clients.
 */
@RestController
@RequestMapping("/api/v1/clients")
@Tag(name = "Clients", description = "Client management CRUD")
public class ClientController {

    private final ClientService clientService;

    public ClientController(ClientService clientService) {
        this.clientService = clientService;
    }

    /**
     * Creates a new client.
     *
     * @param request the create request body
     * @return 201 Created with the client response and Location header
     */
    @PostMapping
    @Operation(summary = "Create a new client")
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody CreateClientRequest request) {
        ClientCommand.Create cmd = new ClientCommand.Create(
            request.name(),
            request.email(),
            request.phone(),
            request.address(),
            request.companyName(),
            request.companyAddress(),
            request.companyVatNumber(),
            request.companyIban(),
            request.companySwiftBic(),
            request.companyBankName()
        );
        Client client = clientService.create(cmd);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
            .path("/{id}")
            .buildAndExpand(client.id())
            .toUri();
        return ResponseEntity.created(location).body(toResponse(client));
    }

    /**
     * Lists clients with optional search query and pagination.
     *
     * @param query    optional search term (name/email substring)
     * @param pageable pagination and sort parameters
     * @return 200 with paginated client list
     */
    @GetMapping
    @Operation(summary = "List clients with optional search and pagination")
    public ResponseEntity<PageResponse<ClientResponse>> list(
        @RequestParam(required = false) String query,
        @PageableDefault(size = 20, sort = "name") Pageable pageable
    ) {
        Page<Client> page = clientService.list(query, pageable);
        List<ClientResponse> content = page.getContent().stream()
            .map(this::toResponse)
            .toList();
        PageResponse<ClientResponse> response = new PageResponse<>(
            content,
            page.getNumber(),
            page.getSize(),
            page.getTotalElements(),
            page.getTotalPages()
        );
        return ResponseEntity.ok(response);
    }

    /**
     * Retrieves a single client by ID.
     *
     * @param id the client UUID
     * @return 200 with the client, or 404 if not found
     */
    @GetMapping("/{id}")
    @Operation(summary = "Get a client by ID")
    public ResponseEntity<ClientResponse> get(@PathVariable UUID id) {
        Client client = clientService.get(id);
        return ResponseEntity.ok(toResponse(client));
    }

    /**
     * Updates an existing client (full replacement).
     *
     * @param id      the client UUID
     * @param request the update request body
     * @return 200 with the updated client
     */
    @PutMapping("/{id}")
    @Operation(summary = "Update a client")
    public ResponseEntity<ClientResponse> update(
        @PathVariable UUID id,
        @Valid @RequestBody UpdateClientRequest request
    ) {
        ClientCommand.Update cmd = new ClientCommand.Update(
            request.name(),
            request.email(),
            request.phone(),
            request.address(),
            request.companyName(),
            request.companyAddress(),
            request.companyVatNumber(),
            request.companyIban(),
            request.companySwiftBic(),
            request.companyBankName()
        );
        Client client = clientService.update(id, cmd);
        return ResponseEntity.ok(toResponse(client));
    }

    /**
     * Soft-deletes a client.
     *
     * @param id the client UUID
     * @return 204 No Content
     */
    @DeleteMapping("/{id}")
    @Operation(summary = "Soft-delete a client")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        clientService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private ClientResponse toResponse(Client client) {
        return new ClientResponse(
            client.id(),
            client.name(),
            client.email(),
            client.phone(),
            client.address(),
            client.companyName(),
            client.companyAddress(),
            client.companyVatNumber(),
            client.companyIban(),
            client.companySwiftBic(),
            client.companyBankName(),
            client.createdAt(),
            client.updatedAt()
        );
    }
}
