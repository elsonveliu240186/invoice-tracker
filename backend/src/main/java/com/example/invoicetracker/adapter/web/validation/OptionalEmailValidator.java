package com.example.invoicetracker.adapter.web.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import java.util.regex.Pattern;

/**
 * Constraint validator for {@link OptionalEmail}.
 * Allows null or blank values; validates non-blank values against a basic email pattern.
 */
public class OptionalEmailValidator implements ConstraintValidator<OptionalEmail, String> {

    // RFC 5322-compatible simplified pattern (same as Hibernate Validator's @Email uses)
    private static final Pattern EMAIL_PATTERN =
        Pattern.compile("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$");

    @Override
    public boolean isValid(String value, ConstraintValidatorContext context) {
        if (value == null || value.isBlank()) {
            return true;
        }
        return EMAIL_PATTERN.matcher(value).matches();
    }
}
