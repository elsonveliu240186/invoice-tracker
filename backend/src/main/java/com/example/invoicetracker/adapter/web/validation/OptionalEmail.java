package com.example.invoicetracker.adapter.web.validation;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;
import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Validates that a field is either blank/null or a well-formed email address.
 * Unlike {@code @Email}, this annotation allows empty strings.
 */
@Documented
@Constraint(validatedBy = OptionalEmailValidator.class)
@Target({ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER, ElementType.ANNOTATION_TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface OptionalEmail {

    /** Default constraint violation message. */
    String message() default "must be a well-formed email address or empty";

    /** Constraint groups. */
    Class<?>[] groups() default {};

    /** Constraint payload. */
    Class<? extends Payload>[] payload() default {};
}
