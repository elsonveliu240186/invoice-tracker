package com.example.invoicetracker.domain;

/**
 * Thrown when a registration attempt uses an email that already exists.
 */
public class UserEmailTakenException extends RuntimeException {

    public UserEmailTakenException(String email) {
        super("Email already registered: " + email);
    }
}
