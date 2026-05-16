package com.example.invoicetracker.adapter.web.error;

import com.example.invoicetracker.application.template.InvalidTemplateException;
import com.example.invoicetracker.application.template.TemplateNotFoundException;
import com.example.invoicetracker.application.template.TemplateTooLargeException;
import com.example.invoicetracker.domain.UserEmailTakenException;
import com.example.invoicetracker.domain.client.ClientEmailTakenException;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
<<<<<<< HEAD
import com.example.invoicetracker.domain.invoice.ArtifactAlreadyExistsException;
import com.example.invoicetracker.domain.invoice.ArtifactTooLargeException;
=======
import com.example.invoicetracker.domain.expense.ExpenseNotFoundException;
>>>>>>> feat/FEAT-20260516-01-expense-tracking
import com.example.invoicetracker.domain.invoice.EmailDeliveryFailedException;
import com.example.invoicetracker.domain.invoice.GeneratedArtifactNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceHasNoRecipientException;
import com.example.invoicetracker.domain.invoice.InvoiceNotEditableException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceNumberTakenException;
import com.example.invoicetracker.domain.invoice.PdfConversionFailedException;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

/**
 * Translates domain and validation exceptions to RFC 7807 ProblemDetail responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /**
     * Handles unreadable/malformed request bodies (400).
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ProblemDetail handleHttpMessageNotReadable(HttpMessageNotReadableException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Bad Request");
        problem.setDetail("Request body is malformed or contains an invalid value.");
        problem.setProperty("code", "VALIDATION_FAILED");
        return problem;
    }

    /**
     * Handles type mismatch on method arguments, e.g. bad enum or date format in query param (400).
     */
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ProblemDetail handleMethodArgumentTypeMismatch(MethodArgumentTypeMismatchException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Bad Request");
        problem.setDetail("Invalid value for parameter: " + ex.getName());
        problem.setProperty("code", "VALIDATION_FAILED");
        return problem;
    }

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
     * Handles invalid credentials (401).
     */
    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNAUTHORIZED);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Unauthorized");
        problem.setDetail("Invalid credentials.");
        problem.setProperty("code", "INVALID_CREDENTIALS");
        return problem;
    }

    /**
     * Handles user email already taken (409).
     */
    @ExceptionHandler(UserEmailTakenException.class)
    public ProblemDetail handleUserEmailTaken(UserEmailTakenException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Conflict");
        problem.setDetail("A user with this email already exists.");
        problem.setProperty("code", "USER_EMAIL_TAKEN");
        return problem;
    }

    /**
     * Handles expense-not-found (404).
     */
    @ExceptionHandler(ExpenseNotFoundException.class)
    public ProblemDetail handleExpenseNotFound(ExpenseNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Not Found");
        problem.setDetail("Expense not found.");
        problem.setProperty("code", "EXPENSE_NOT_FOUND");
        return problem;
    }

    /**
     * Handles invoice-not-found (404).
     */
    @ExceptionHandler(InvoiceNotFoundException.class)
    public ProblemDetail handleInvoiceNotFound(InvoiceNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Not Found");
        problem.setDetail("Invoice not found.");
        problem.setProperty("code", "INVOICE_NOT_FOUND");
        return problem;
    }

    /**
     * Handles invoice not editable (409).
     */
    @ExceptionHandler(InvoiceNotEditableException.class)
    public ProblemDetail handleInvoiceNotEditable(InvoiceNotEditableException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Conflict");
        problem.setDetail("Invoice cannot be edited because it is not in DRAFT status.");
        problem.setProperty("code", "INVOICE_NOT_EDITABLE");
        return problem;
    }

    /**
     * Handles invoice number already taken (409).
     */
    @ExceptionHandler(InvoiceNumberTakenException.class)
    public ProblemDetail handleInvoiceNumberTaken(InvoiceNumberTakenException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Conflict");
        problem.setDetail("An invoice with this number already exists.");
        problem.setProperty("code", "INVOICE_NUMBER_TAKEN");
        return problem;
    }

    /**
     * Handles invoice has no recipient (422).
     */
    @ExceptionHandler(InvoiceHasNoRecipientException.class)
    public ProblemDetail handleInvoiceHasNoRecipient(InvoiceHasNoRecipientException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNPROCESSABLE_ENTITY);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Unprocessable Entity");
        problem.setDetail("The client associated with this invoice has no email address.");
        problem.setProperty("code", "INVOICE_HAS_NO_RECIPIENT");
        return problem;
    }

    /**
     * Handles email delivery failures (502).
     */
    @ExceptionHandler(EmailDeliveryFailedException.class)
    public ProblemDetail handleEmailDeliveryFailed(EmailDeliveryFailedException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_GATEWAY);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Bad Gateway");
        problem.setDetail("Email delivery failed. Please try again later.");
        problem.setProperty("code", "EMAIL_DELIVERY_FAILED");
        return problem;
    }

    /**
     * Handles invalid template uploads (415).
     */
    @ExceptionHandler(TemplateNotFoundException.class)
    public ProblemDetail handleTemplateNotFound(TemplateNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Template Not Found");
        problem.setDetail(ex.getMessage());
        problem.setProperty("code", "TEMPLATE_NOT_FOUND");
        return problem;
    }

    @ExceptionHandler(InvalidTemplateException.class)
    public ProblemDetail handleInvalidTemplate(InvalidTemplateException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.UNSUPPORTED_MEDIA_TYPE);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Invalid Template");
        problem.setDetail(ex.getMessage());
        problem.setProperty("code", "INVALID_TEMPLATE_TYPE");
        return problem;
    }

    /**
     * Handles template uploads that exceed the size limit (413).
     */
    @ExceptionHandler(TemplateTooLargeException.class)
    public ProblemDetail handleTemplateTooLarge(TemplateTooLargeException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.PAYLOAD_TOO_LARGE);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Template Too Large");
        problem.setDetail(ex.getMessage());
        problem.setProperty("code", "TEMPLATE_TOO_LARGE");
        return problem;
    }

    /**
     * Handles Spring's multipart size exceeded exception (413).
     */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ProblemDetail handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.PAYLOAD_TOO_LARGE);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Template Too Large");
        problem.setDetail("Uploaded file exceeds the maximum allowed size.");
        problem.setProperty("code", "TEMPLATE_TOO_LARGE");
        return problem;
    }

    /**
     * Handles generated artefact not found (404).
     */
    @ExceptionHandler(GeneratedArtifactNotFoundException.class)
    public ProblemDetail handleGeneratedArtifactNotFound(GeneratedArtifactNotFoundException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.NOT_FOUND);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Not Found");
        problem.setDetail("Generated artefact not found.");
        problem.setProperty("code", "GENERATED_ARTIFACT_NOT_FOUND");
        return problem;
    }

    /**
     * Handles artefact already exists conflict (409).
     */
    @ExceptionHandler(ArtifactAlreadyExistsException.class)
    public ProblemDetail handleArtifactAlreadyExists(ArtifactAlreadyExistsException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.CONFLICT);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Conflict");
        problem.setDetail("An artefact for this invoice and format already exists.");
        problem.setProperty("code", "ARTIFACT_ALREADY_EXISTS");
        return problem;
    }

    /**
     * Handles artefact too large (413).
     */
    @ExceptionHandler(ArtifactTooLargeException.class)
    public ProblemDetail handleArtifactTooLarge(ArtifactTooLargeException ex) {
        ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.PAYLOAD_TOO_LARGE);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("Payload Too Large");
        problem.setDetail(ex.getMessage());
        problem.setProperty("code", "ARTIFACT_TOO_LARGE");
        return problem;
    }

    /**
     * Handles PDF conversion failures (502).
     */
    @ExceptionHandler(PdfConversionFailedException.class)
    public ProblemDetail handlePdfConversionFailed(PdfConversionFailedException ex) {
        String code = ex.isBusy() ? "PDF_CONVERSION_BUSY" : "PDF_CONVERSION_FAILED";
        HttpStatus status = ex.isBusy() ? HttpStatus.SERVICE_UNAVAILABLE : HttpStatus.BAD_GATEWAY;
        ProblemDetail problem = ProblemDetail.forStatus(status);
        problem.setType(URI.create("about:blank"));
        problem.setTitle("PDF Conversion Failed");
        problem.setDetail(ex.getMessage());
        problem.setProperty("code", code);
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
