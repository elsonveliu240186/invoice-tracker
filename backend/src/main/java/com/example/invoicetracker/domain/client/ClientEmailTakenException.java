package com.example.invoicetracker.domain.client;

/**
 * Thrown when a client with the given email already exists (case-insensitive, among active rows).
 */
public class ClientEmailTakenException extends RuntimeException {

    public ClientEmailTakenException(String email) {
        super("A client with this email already exists: " + email);
    }
}
