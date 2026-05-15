package com.example.invoicetracker.application.template;

/**
 * Thrown when an uploaded file fails DOCX validation
 * (magic-byte check, missing ZIP entry, or external relationship reference).
 * Maps to HTTP 415 Unsupported Media Type.
 */
public class InvalidTemplateException extends RuntimeException {

    /**
     * Constructs the exception with a reason message.
     *
     * @param reason human-readable description of the validation failure
     */
    public InvalidTemplateException(String reason) {
        super("Invalid template: " + reason);
    }
}
