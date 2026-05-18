package com.example.invoicetracker.adapter.web.settings.dto;

import com.example.invoicetracker.adapter.web.validation.OptionalEmail;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for PUT /api/v1/settings/company.
 * Only {@code name} is required; all other fields are optional (null normalised to empty).
 */
public record CompanyProfileRequest(
    @NotBlank
    @Size(max = 200)
    String name,

    @Size(max = 500)
    String address,

    @Size(max = 32)
    String phone,

    @OptionalEmail
    @Size(max = 254)
    String email,

    @Size(max = 50)
    String vatNumber,

    @Size(max = 100)
    String iban,

    @Size(max = 20)
    String swiftBic,

    @Size(max = 200)
    String bankName
) {
    /** Normalises null optional fields to empty strings. */
    public CompanyProfileRequest {
        address   = address   != null ? address   : "";
        phone     = phone     != null ? phone     : "";
        email     = email     != null ? email     : "";
        vatNumber = vatNumber != null ? vatNumber : "";
        iban      = iban      != null ? iban      : "";
        swiftBic  = swiftBic  != null ? swiftBic  : "";
        bankName  = bankName  != null ? bankName  : "";
    }
}
