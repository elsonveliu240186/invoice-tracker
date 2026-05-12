package com.example.invoicetracker.adapter.web.auth;

import com.example.invoicetracker.adapter.web.auth.dto.AuthResponse;
import com.example.invoicetracker.adapter.web.auth.dto.ForgotPasswordRequest;
import com.example.invoicetracker.adapter.web.auth.dto.LoginRequest;
import com.example.invoicetracker.adapter.web.auth.dto.RegisterRequest;
import com.example.invoicetracker.application.AuthService;
import com.example.invoicetracker.domain.AppUser;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for authentication endpoints at /api/v1/auth.
 */
@RestController
@RequestMapping("/api/v1/auth")
@Tag(name = "Auth", description = "Authentication: login, register, forgot-password")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Authenticates a user by email and password.
     *
     * @param request the login request body
     * @return 200 with email and displayName on success; 401 on bad credentials
     */
    @PostMapping("/login")
    @Operation(summary = "Login with email and password")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AppUser user = authService.login(request.email(), request.password());
        return ResponseEntity.ok(new AuthResponse(user.email(), user.displayName()));
    }

    /**
     * Registers a new user account.
     *
     * @param request the registration request body
     * @return 201 with email and displayName on success; 409 if email already taken
     */
    @PostMapping("/register")
    @Operation(summary = "Register a new user")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        AppUser user = authService.register(
            request.displayName(), request.email(), request.password()
        );
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(new AuthResponse(user.email(), user.displayName()));
    }

    /**
     * Initiates a password-reset flow. Always returns 204 (anti-enumeration).
     *
     * @param request the forgot-password request body
     * @return 204 No Content always
     */
    @PostMapping("/forgot-password")
    @Operation(summary = "Request a password reset email")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.requestPasswordReset(request.email());
        return ResponseEntity.noContent().build();
    }
}
