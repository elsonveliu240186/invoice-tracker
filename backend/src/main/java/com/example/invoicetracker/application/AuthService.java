package com.example.invoicetracker.application;

import com.example.invoicetracker.domain.AppUser;
import com.example.invoicetracker.domain.AppUserRepository;
import com.example.invoicetracker.domain.UserEmailTakenException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for authentication use-cases: register, login, forgot-password.
 */
@Service
@Transactional
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Registers a new user.
     *
     * @param displayName the user's display name
     * @param email       the user's email address
     * @param password    the raw password to be hashed before storage
     * @return the created {@link AppUser}
     * @throws UserEmailTakenException if the email is already registered
     */
    public AppUser register(String displayName, String email, String password) {
        if (appUserRepository.existsByEmail(email)) {
            throw new UserEmailTakenException(email);
        }
        String hash = passwordEncoder.encode(password);
        AppUser user = new AppUser(
            UUID.randomUUID(),
            email,
            displayName,
            hash,
            Instant.now()
        );
        AppUser saved = appUserRepository.save(user);
        log.info("User registered: emailHash={}", truncatedEmailHash(email));
        return saved;
    }

    /**
     * Authenticates a user by email and password.
     *
     * @param email    the user's email
     * @param password the raw password to verify
     * @return the matching {@link AppUser}
     * @throws BadCredentialsException if email not found or password does not match
     */
    @Transactional(readOnly = true)
    public AppUser login(String email, String password) {
        AppUser user = appUserRepository.findByEmail(email)
            .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        if (!passwordEncoder.matches(password, user.passwordHash())) {
            throw new BadCredentialsException("Invalid credentials");
        }
        log.info("User authenticated: emailHash={}", truncatedEmailHash(email));
        return user;
    }

    /**
     * Initiates a password-reset flow. Always returns silently regardless of whether
     * the email exists, to prevent user enumeration (anti-enumeration).
     *
     * @param email the email to send reset instructions to
     */
    public void requestPasswordReset(String email) {
        // TODO: enqueue reset email (tracked as R-3 in docs/FEATURES.md)
        log.info("Password reset requested: emailHash={}", truncatedEmailHash(email));
    }

    private String truncatedEmailHash(String email) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                .digest(email.toLowerCase(java.util.Locale.ROOT).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest).substring(0, 8);
        } catch (NoSuchAlgorithmException e) {
            return "unknown";
        }
    }
}
