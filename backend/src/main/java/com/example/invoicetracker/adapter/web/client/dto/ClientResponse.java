package com.example.invoicetracker.adapter.web.client.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO representing a client.
 */
public record ClientResponse(
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
    Instant updatedAt
) {}
