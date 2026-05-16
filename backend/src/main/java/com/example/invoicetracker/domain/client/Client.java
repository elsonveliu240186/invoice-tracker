package com.example.invoicetracker.domain.client;

import java.time.Instant;
import java.util.UUID;

/**
 * Domain record representing a client in the invoice-tracker system.
 */
public record Client(
    UUID id,
    String name,
    String email,
    String phone,
    String address,
    String companyName,
    String companyAddress,
    String companyVatNumber,
    String companyIban,
    String companySwiftBic,
    String companyBankName,
    Instant createdAt,
    Instant updatedAt,
    Instant deletedAt
) {}
