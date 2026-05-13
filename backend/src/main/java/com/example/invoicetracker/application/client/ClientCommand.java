package com.example.invoicetracker.application.client;

/**
 * Sealed command hierarchy for client use-cases.
 */
public sealed interface ClientCommand {

    /**
     * Command to create a new client.
     */
    record Create(
        String name,
        String email,
        String phone,
        String address
    ) implements ClientCommand {}

    /**
     * Command to update an existing client (full replacement / PUT semantics).
     */
    record Update(
        String name,
        String email,
        String phone,
        String address
    ) implements ClientCommand {}
}
