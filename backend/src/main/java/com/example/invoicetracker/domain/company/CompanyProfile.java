package com.example.invoicetracker.domain.company;

import java.time.Instant;

/**
 * Domain record representing the persisted company profile singleton.
 * All fields are normalised to empty strings on construction — never null.
 */
public record CompanyProfile(
    String name,
    String address,
    String phone,
    String email,
    String vatNumber,
    String iban,
    String swiftBic,
    String bankName,
    Instant updatedAt
) {
    /** Normalises null values to empty strings. */
    public CompanyProfile {
        name      = name      != null ? name      : "";
        address   = address   != null ? address   : "";
        phone     = phone     != null ? phone     : "";
        email     = email     != null ? email     : "";
        vatNumber = vatNumber != null ? vatNumber : "";
        iban      = iban      != null ? iban      : "";
        swiftBic  = swiftBic  != null ? swiftBic  : "";
        bankName  = bankName  != null ? bankName  : "";
    }
}
