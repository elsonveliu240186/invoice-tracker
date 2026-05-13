package com.example.invoicetracker.domain;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain record representing an application user.
 */
public record AppUser(
    UUID id,
    String email,
    String displayName,
    String passwordHash,
    Instant createdAt
) {}
