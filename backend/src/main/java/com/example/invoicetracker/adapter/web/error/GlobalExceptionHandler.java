package com.example.invoicetracker.adapter.web.error;

import com.example.invoicetracker.domain.client.ClientEmailTakenException;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Translates domain and validation exceptions to RFC 7807 ProblemDetail responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles bean-validation errors (400).
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Validation Failed");
        problem.setProperty("code", "VALIDATION_FAILED");

        List<Map<String, String>> fieldErrors = ex.getBindingResult()
            .getFieldErrors()
            .stream()
            .map(this::toFieldErrorMap)
            .toList();
        problem.setProperty("fieldErrors", fieldErrors);

        return problem;
    }

    /**
     * Handles client-not-found (404).
     */
    @ExceptionHandler(ClientNotFoundException.class)
    public ProblemDetail handleClientNotFound(ClientNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Not Found");
        problem.setDetail("Client not found.");
        problem.setProperty("code", "CLIENT_NOT_FOUND");
        return problem;
    }

    /**
     * Handles duplicate-email conflict (409).
     */
    @ExceptionHandler(ClientEmailTakenException.class)
    public ProblemDetail handleClientEmailTaken(ClientEmailTakenException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Conflict");
        problem.setDetail("A client with this email already exists.");
        problem.setProperty("code", "CLIENT_EMAIL_TAKEN");
        return problem;
    }

    /**
     * Fallback handler for unexpected exceptions (500).
     */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGenericException(Exception ex) {
        log.error("Unhandled exception", ex);
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Internal Server Error");
        problem.setDetail("An unexpected error occurred.");
        problem.setProperty("code", "INTERNAL_ERROR");
        return problem;
    }

    private Map<String, String> toFieldErrorMap(FieldError fe) {
        Map<String, String> map = new LinkedHashMap<>();
        map.put("field", fe.getField());
        map.put("message", fe.getDefaultMessage());
        return map;
    }
}
