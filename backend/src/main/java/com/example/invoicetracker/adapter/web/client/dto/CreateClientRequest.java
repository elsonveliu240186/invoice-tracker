package com.example.invoicetracker.adapter.web.client.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for creating a new client.
 */
public record CreateClientRequest(

    @NotBlank
    @Size(min = 1, max = 120)
    String name,

    @NotBlank
    @Email
    @Size(max = 254)
    String email,

    @Size(max = 32)
    @Pattern(regexp = "^[+\\-() 0-9]*$")
    String phone,

    @Size(max = 500)
    String address,

    @Size(max = 200)
    String companyName,

    @Size(max = 500)
    String companyAddress,

    @Size(max = 50)
    String companyVatNumber,

    @Size(max = 100)
    String companyIban,

    @Size(max = 20)
    String companySwiftBic,

    @Size(max = 200)
    String companyBankName
) {}
