package com.example.invoicetracker.adapter.web.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /api/v1/auth/forgot-password.
 */
public record ForgotPasswordRequest(@NotBlank @Email String email) {}
