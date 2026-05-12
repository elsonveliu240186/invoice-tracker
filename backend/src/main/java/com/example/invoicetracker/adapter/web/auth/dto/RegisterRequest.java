package com.example.invoicetracker.adapter.web.auth.dto;

import com.example.invoicetracker.adapter.web.validation.ValidPassword;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /api/v1/auth/register.
 */
public record RegisterRequest(
    @NotBlank @Size(max = 120) String displayName,
    @NotBlank @Email String email,
    @ValidPassword String password
) {}
