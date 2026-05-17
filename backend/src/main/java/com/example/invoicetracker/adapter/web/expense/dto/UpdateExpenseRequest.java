package com.example.invoicetracker.adapter.web.expense.dto;

import com.example.invoicetracker.domain.expense.ExpenseCategory;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * Request DTO for updating an existing expense (full replacement).
 */
public record UpdateExpenseRequest(

    @NotNull
    @DecimalMin(value = "0.01", message = "must be greater than 0")
    @DecimalMax(value = "9999999.99", message = "must be at most 9999999.99")
    @Digits(integer = 7, fraction = 2, message = "must have at most 7 integer digits and 2 decimal places")
    BigDecimal amount,

    @NotNull
    ExpenseCategory category,

    @Size(max = 500, message = "must not exceed 500 characters")
    String description,

    @NotNull
    @PastOrPresent
    LocalDate expenseDate
) {}
