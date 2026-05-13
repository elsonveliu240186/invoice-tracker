package com.example.invoicetracker.adapter.web.client.dto;

import java.util.List;

/**
 * Generic pagination wrapper for list responses.
 *
 * @param <T> the content element type
 */
public record PageResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages
) {}
