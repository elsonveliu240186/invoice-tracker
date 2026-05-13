package com.example.invoicetracker.adapter.web.error;

import static org.assertj.core.api.Assertions.assertThat;

import com.example.invoicetracker.domain.client.ClientEmailTakenException;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.validation.BeanPropertyBindingResult;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.context.request.ServletWebRequest;

class GlobalExceptionHandlerTest {

    private GlobalExceptionHandler handler;

    @BeforeEach
    void setUp() {
        handler = new GlobalExceptionHandler();
    }

    @Test
    void handles_method_argument_not_valid() throws Exception {
        // Use a bean that actually has a "name" property so BeanPropertyBindingResult works.
        record NamedBean(String name) {}
        BindingResult bindingResult = new BeanPropertyBindingResult(new NamedBean(""), "target");
        bindingResult.rejectValue("name", "NotBlank", "must not be blank");

        MethodArgumentNotValidException ex = new MethodArgumentNotValidException(null, bindingResult);
        ProblemDetail problem = handler.handleMethodArgumentNotValid(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(problem.getProperties()).containsKey("code");
        assertThat(problem.getProperties().get("code")).isEqualTo("VALIDATION_FAILED");
        assertThat(problem.getProperties()).containsKey("fieldErrors");
    }

    @Test
    void handles_client_not_found() {
        ClientNotFoundException ex = new ClientNotFoundException(UUID.randomUUID());
        ProblemDetail problem = handler.handleClientNotFound(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(problem.getProperties().get("code")).isEqualTo("CLIENT_NOT_FOUND");
    }

    @Test
    void handles_client_email_taken() {
        ClientEmailTakenException ex = new ClientEmailTakenException("dup@example.com");
        ProblemDetail problem = handler.handleClientEmailTaken(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(problem.getProperties().get("code")).isEqualTo("CLIENT_EMAIL_TAKEN");
        assertThat(problem.getDetail()).contains("already exists");
    }

    @Test
    void handles_unknown_exception_as_500() {
        Exception ex = new RuntimeException("unexpected");
        ProblemDetail problem = handler.handleGenericException(ex);

        assertThat(problem.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(problem.getProperties().get("code")).isEqualTo("INTERNAL_ERROR");
    }
}
