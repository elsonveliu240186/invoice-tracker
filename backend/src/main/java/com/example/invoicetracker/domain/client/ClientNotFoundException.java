package com.example.invoicetracker.domain.client;

import java.util.UUID;

/**
 * Thrown when a client cannot be found by the given ID, or is soft-deleted.
 */
public class ClientNotFoundException extends RuntimeException {

    public ClientNotFoundException(UUID id) {
        super("Client not found: " + id);
    }
}
