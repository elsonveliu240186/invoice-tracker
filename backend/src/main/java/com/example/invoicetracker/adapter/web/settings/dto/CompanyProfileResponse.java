package com.example.invoicetracker.adapter.web.settings.dto;

import java.time.Instant;

/**
 * Response body for GET and PUT /api/v1/settings/company.
 */
public record CompanyProfileResponse(
    String name,
    String address,
    String phone,
    String email,
    String vatNumber,
    String iban,
    String swiftBic,
    String bankName,
    Instant updatedAt
) {}
