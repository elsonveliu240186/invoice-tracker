package com.example.invoicetracker.adapter.web.client;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.application.client.ClientCommand;
import com.example.invoicetracker.application.client.ClientService;
import com.example.invoicetracker.config.SecurityConfig;
import com.example.invoicetracker.domain.client.Client;
import com.example.invoicetracker.domain.client.ClientEmailTakenException;
import com.example.invoicetracker.domain.client.ClientNotFoundException;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(ClientController.class)
@Import(SecurityConfig.class)
class ClientControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    ClientService clientService;

    private Client makeClient(UUID id) {
        Instant now = Instant.now();
        return new Client(id, "Acme Corp", "acme@example.com", "+1 555-0100", "123 Main St",
            now, now, null);
    }

    @Test
    @WithMockUser
    void create_returns_201_with_location() throws Exception {
        UUID id = UUID.randomUUID();
        Client client = makeClient(id);
        when(clientService.create(any(ClientCommand.Create.class))).thenReturn(client);

        mvc.perform(post("/api/v1/clients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Acme Corp","email":"acme@example.com",
                     "phone":"+1 555-0100","address":"123 Main St"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(header().string("Location",
                org.hamcrest.Matchers.endsWith("/api/v1/clients/" + id)))
            .andExpect(jsonPath("$.id").value(id.toString()))
            .andExpect(jsonPath("$.name").value("Acme Corp"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_name_blank() throws Exception {
        mvc.perform(post("/api/v1/clients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"","email":"acme@example.com"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_email_invalid() throws Exception {
        mvc.perform(post("/api/v1/clients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Acme","email":"not-an-email"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_400_when_phone_pattern_invalid() throws Exception {
        mvc.perform(post("/api/v1/clients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Acme","email":"acme@example.com","phone":"abc-invalid!"}
                    """))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    @Test
    @WithMockUser
    void create_returns_409_when_email_taken() throws Exception {
        when(clientService.create(any(ClientCommand.Create.class)))
            .thenThrow(new ClientEmailTakenException("acme@example.com"));

        mvc.perform(post("/api/v1/clients")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Acme","email":"acme@example.com"}
                    """))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.code").value("CLIENT_EMAIL_TAKEN"));
    }

    @Test
    @WithMockUser
    void get_returns_200() throws Exception {
        UUID id = UUID.randomUUID();
        when(clientService.get(id)).thenReturn(makeClient(id));

        mvc.perform(get("/api/v1/clients/{id}", id))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    @WithMockUser
    void get_returns_404_when_not_found() throws Exception {
        UUID id = UUID.randomUUID();
        when(clientService.get(id)).thenThrow(new ClientNotFoundException(id));

        mvc.perform(get("/api/v1/clients/{id}", id))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("CLIENT_NOT_FOUND"));
    }

    @Test
    @WithMockUser
    void list_returns_page_envelope() throws Exception {
        UUID id = UUID.randomUUID();
        List<Client> clients = List.of(makeClient(id));
        Page<Client> page = new PageImpl<>(clients);
        when(clientService.list(any(), any(Pageable.class))).thenReturn(page);

        mvc.perform(get("/api/v1/clients"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray())
            .andExpect(jsonPath("$.content[0].id").value(id.toString()))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.totalElements").value(1));
    }

    @Test
    @WithMockUser
    void update_returns_200() throws Exception {
        UUID id = UUID.randomUUID();
        Client updated = makeClient(id);
        when(clientService.update(eq(id), any(ClientCommand.Update.class))).thenReturn(updated);

        mvc.perform(put("/api/v1/clients/{id}", id)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"Acme Updated","email":"acme@example.com"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(id.toString()));
    }

    @Test
    @WithMockUser
    void delete_returns_204() throws Exception {
        UUID id = UUID.randomUUID();
        doNothing().when(clientService).delete(id);

        mvc.perform(delete("/api/v1/clients/{id}", id))
            .andExpect(status().isNoContent());
    }

    @Test
    void unauthenticated_returns_401() throws Exception {
        mvc.perform(get("/api/v1/clients"))
            .andExpect(status().isUnauthorized());
    }
}
