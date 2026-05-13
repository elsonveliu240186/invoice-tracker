package com.example.invoicetracker.config;

import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.application.AuthService;
import com.example.invoicetracker.application.client.ClientService;
import com.example.invoicetracker.domain.AppUser;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK)
@Testcontainers
class SecurityConfigTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    AuthService authService;

    @MockitoBean
    ClientService clientService;

    MockMvc mvc;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
    }

    @Test
    void auth_endpoints_are_public_login() throws Exception {
        AppUser user = new AppUser(
            UUID.randomUUID(), "alice@example.com", "Alice", "hash", Instant.now()
        );
        when(authService.login("alice@example.com", "Secret1!")).thenReturn(user);

        // No authentication header — should reach controller and return 200
        mvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"alice@example.com","password":"Secret1!"}
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void auth_endpoints_are_public_register() throws Exception {
        AppUser user = new AppUser(
            UUID.randomUUID(), "bob@example.com", "Bob", "hash", Instant.now()
        );
        when(authService.register(anyString(), anyString(), anyString())).thenReturn(user);

        mvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"displayName":"Bob","email":"bob@example.com","password":"Password1"}
                    """))
            .andExpect(status().isCreated());
    }

    @Test
    void auth_endpoints_are_public_forgot_password() throws Exception {
        doNothing().when(authService).requestPasswordReset(anyString());

        mvc.perform(post("/api/v1/auth/forgot-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email":"anyone@example.com"}
                    """))
            .andExpect(status().isNoContent());
    }

    @Test
    void clients_endpoint_still_requires_basic() throws Exception {
        when(clientService.list(anyString(), org.mockito.ArgumentMatchers.any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of()));

        // No authentication — should return 401
        mvc.perform(get("/api/v1/clients"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void actuator_health_is_public() throws Exception {
        mvc.perform(get("/actuator/health"))
            .andExpect(status().isOk());
    }

    @Test
    @SuppressWarnings("PMD.JUnitTestsShouldIncludeAssert")
    void clients_endpoint_with_pagination_requires_auth() throws Exception {
        mvc.perform(get("/api/v1/clients?page=0&size=10"))
            .andExpect(status().isUnauthorized());
    }
}
