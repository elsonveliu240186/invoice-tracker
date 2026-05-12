package com.example.invoicetracker.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.example.invoicetracker.domain.AppUser;
import com.example.invoicetracker.domain.AppUserRepository;
import com.example.invoicetracker.domain.UserEmailTakenException;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AppUserRepository appUserRepository;

    private PasswordEncoder passwordEncoder;
    private AuthService authService;

    @BeforeEach
    void setUp() {
        passwordEncoder = new BCryptPasswordEncoder(4); // cost 4 for test speed
        authService = new AuthService(appUserRepository, passwordEncoder);
    }

    // ---- login tests ----

    @Test
    void login_returns_user_for_valid_credentials() {
        String rawPassword = "Secret1!";
        String hash = passwordEncoder.encode(rawPassword);
        AppUser user = makeUser("Alice", "alice@example.com", hash);

        when(appUserRepository.findByEmail("alice@example.com")).thenReturn(Optional.of(user));

        AppUser result = authService.login("alice@example.com", rawPassword);

        assertThat(result.email()).isEqualTo("alice@example.com");
        assertThat(result.displayName()).isEqualTo("Alice");
    }

    @Test
    void login_throws_BadCredentials_on_unknown_email() {
        when(appUserRepository.findByEmail(anyString())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login("nobody@example.com", "anypass"))
            .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    void login_throws_BadCredentials_on_wrong_password() {
        String hash = passwordEncoder.encode("correct1");
        AppUser user = makeUser("Bob", "bob@example.com", hash);
        when(appUserRepository.findByEmail("bob@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login("bob@example.com", "wrong1"))
            .isInstanceOf(BadCredentialsException.class);
    }

    // ---- register tests ----

    @Test
    void register_persists_hashed_password() {
        when(appUserRepository.existsByEmail("new@example.com")).thenReturn(false);
        ArgumentCaptor<AppUser> captor = ArgumentCaptor.forClass(AppUser.class);
        when(appUserRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));

        authService.register("Charlie", "new@example.com", "Password1");

        AppUser saved = captor.getValue();
        assertThat(saved.passwordHash()).isNotEqualTo("Password1");
        assertThat(passwordEncoder.matches("Password1", saved.passwordHash())).isTrue();
        assertThat(saved.email()).isEqualTo("new@example.com");
        assertThat(saved.displayName()).isEqualTo("Charlie");
        assertThat(saved.id()).isNotNull();
    }

    @Test
    void register_throws_Conflict_on_duplicate_email() {
        when(appUserRepository.existsByEmail("dup@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register("Dup", "dup@example.com", "Password1"))
            .isInstanceOf(UserEmailTakenException.class);

        verify(appUserRepository, never()).save(any());
    }

    // ---- requestPasswordReset tests ----

    @Test
    void requestPasswordReset_is_silent_on_unknown_email() {
        // Should not throw and should not call any repo method
        authService.requestPasswordReset("ghost@example.com");

        verify(appUserRepository, never()).save(any());
        verify(appUserRepository, never()).findByEmail(anyString());
    }

    @Test
    void requestPasswordReset_is_silent_on_known_email() {
        // Same behaviour regardless of whether email exists
        authService.requestPasswordReset("known@example.com");

        verify(appUserRepository, never()).save(any());
    }

    private AppUser makeUser(String displayName, String email, String passwordHash) {
        return new AppUser(UUID.randomUUID(), email, displayName, passwordHash, Instant.now());
    }
}
