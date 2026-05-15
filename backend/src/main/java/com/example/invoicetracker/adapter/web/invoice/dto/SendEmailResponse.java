package com.example.invoicetracker.adapter.web.invoice.dto;

import java.time.Instant;

/**
 * Response body for the send-email endpoint.
 */
public record SendEmailResponse(Instant lastSentAt) {}
