package com.example.invoicetracker.adapter.web.auth;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.application.AuthService;
import com.example.invoicetracker.domain.AppUser;
import com.example.invoicetracker.domain.UserEmailTakenException;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(
    webEnvironment = WebEnvironment.MOCK,
    properties = "app.auth.rate-limit.capacity=10000"
)
@Testcontainers
class AuthControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    AuthService authService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    }

    private AppUser makeUser() {
        return new AppUser(UUID.randomUUID(), "alice@example.com", "Alice", "hash", Instant.now());
    }

    // ---- POST /api/v1/auth/login ----

    @Test
    void login_returns_200_with_body() throws Exception {
        when(authService.login("alice@example.com", "Secret1!")).thenReturn(makeUser());

        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":"Secret1!"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("alice@example.com"))
            .andExpect(jsonPath("$.displayName").value("Alice"));
    }

    @Test
    void login_returns_400_on_missing_email() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"password":"Secret1!"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void login_returns_400_on_blank_password() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":""}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void login_returns_400_on_invalid_email_format() throws Exception {
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"not-an-email","password":"Secret1!"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void login_returns_401_on_bad_credentials() throws Exception {
        when(authService.login(anyString(), anyString()))
            .thenThrow(new BadCredentialsException("Invalid credentials"));

        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":"wrong"}
                    """))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
    }

    // ---- POST /api/v1/auth/register ----

    @Test
    void register_returns_201_with_body() throws Exception {
        when(authService.register("Alice", "alice@example.com", "Password1"))
            .thenReturn(makeUser());

        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"displayName":"Alice","email":"alice@example.com","password":"Password1"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value("alice@example.com"))
            .andExpect(jsonPath("$.displayName").value("Alice"));
    }

    @Test
    void register_returns_400_on_weak_password() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"displayName":"Alice","email":"alice@example.com","password":"short"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void register_returns_400_on_missing_display_name() throws Exception {
        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":"Password1"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    void register_returns_409_problem_json_on_duplicate() throws Exception {
        when(authService.register(anyString(), anyString(), anyString()))
            .thenThrow(new UserEmailTakenException("alice@example.com"));

        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"displayName":"Alice","email":"alice@example.com","password":"Password1"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("USER_EMAIL_TAKEN"));
    }

    // ---- POST /api/v1/auth/forgot-password ----

    @Test
    void forgotPassword_returns_204_always() throws Exception {
        doNothing().when(authService).requestPasswordReset(anyString());

        mvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"anyone@example.com"}
                    """))
            .andExpect(status().isNoContent());
    }

    @Test
    void forgotPassword_returns_204_for_unknown_email() throws Exception {
        doNothing().when(authService).requestPasswordReset(anyString());

        mvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"ghost@example.com"}
                    """))
            .andExpect(status().isNoContent());
    }

    @Test
    void forgotPassword_returns_400_on_invalid_email() throws Exception {
        mvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"not-an-email"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    // ---- Auth endpoints are public (no auth required) ----

    @Test
    void login_endpoint_is_accessible_without_authentication() throws Exception {
        when(authService.login("alice@example.com", "Secret1!")).thenReturn(makeUser());

        // No @WithMockUser — should still reach the controller (not filtered by Spring Security)
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":"Secret1!"}
                    """))
            .andExpect(status().isOk());
    }
}
