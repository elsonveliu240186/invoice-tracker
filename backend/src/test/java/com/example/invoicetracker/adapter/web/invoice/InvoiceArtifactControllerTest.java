package com.example.invoicetracker.adapter.web.invoice;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.application.invoice.InvoiceArtifactService;
import com.example.invoicetracker.application.invoice.InvoiceService;
import com.example.invoicetracker.domain.invoice.ArtifactAlreadyExistsException;
import com.example.invoicetracker.domain.invoice.ArtifactFormat;
import com.example.invoicetracker.domain.invoice.GeneratedArtifact;
import com.example.invoicetracker.domain.invoice.GeneratedArtifactNotFoundException;
import com.example.invoicetracker.domain.invoice.InvoiceNotFoundException;
import com.example.invoicetracker.support.InvoiceFixtures;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.test.web.servlet.setup.SecurityMockMvcConfigurers;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

@SpringBootTest(webEnvironment = WebEnvironment.MOCK, classes = Application.class)
@Testcontainers
class InvoiceArtifactControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    InvoiceArtifactService artifactService;

    @MockitoBean
    InvoiceService invoiceService;

    MockMvc mvc;

    private UUID invoiceId;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();
        invoiceId = UUID.randomUUID();
        UUID clientId = UUID.randomUUID();
        // InvoiceController.previewPdf and streamGenerated call invoiceService.get(id) for filename
        when(invoiceService.get(invoiceId))
            .thenReturn(InvoiceFixtures.invoice(invoiceId, clientId));
    }

    // ===== preview-pdf =====

    @Test
    @WithMockUser
    void previewPdf_returns_application_pdf_inline() throws Exception {
        when(artifactService.previewPdf(invoiceId)).thenReturn("pdf-bytes".getBytes());

        mvc.perform(get("/api/v1/invoices/{id}/preview-pdf", invoiceId))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string("Cache-Control", "private, no-store"))
            .andExpect(header().string("Content-Disposition",
                org.hamcrest.Matchers.containsString("inline")))
            .andExpect(content().bytes("pdf-bytes".getBytes()));
    }

    @Test
    @WithMockUser
    void previewPdf_returns_404_when_invoice_missing() throws Exception {
        when(artifactService.previewPdf(invoiceId))
            .thenThrow(new InvoiceNotFoundException(invoiceId));

        mvc.perform(get("/api/v1/invoices/{id}/preview-pdf", invoiceId))
            .andExpect(status().isNotFound());
    }

    @Test
    void previewPdf_returns_401_without_auth() throws Exception {
        mvc.perform(get("/api/v1/invoices/{id}/preview-pdf", invoiceId))
            .andExpect(status().isUnauthorized());
    }

    // ===== generate =====

    @Test
    @WithMockUser
    void generate_returns_201_with_metadata() throws Exception {
        GeneratedArtifact art = new GeneratedArtifact(
            UUID.randomUUID(), invoiceId, ArtifactFormat.PDF, "inv.pdf",
            1234L, "a".repeat(64), Instant.now(), null
        );
        when(artifactService.generate(eq(invoiceId), eq(ArtifactFormat.PDF), eq(false)))
            .thenReturn(art);

        mvc.perform(post("/api/v1/invoices/{id}/generate", invoiceId)
                .param("format", "PDF"))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.format").value("PDF"))
            .andExpect(jsonPath("$.sizeBytes").value(1234));
    }

    @Test
    @WithMockUser
    void generate_returns_409_when_overwrite_false_and_exists() throws Exception {
        when(artifactService.generate(eq(invoiceId), eq(ArtifactFormat.PDF), eq(false)))
            .thenThrow(new ArtifactAlreadyExistsException(invoiceId, ArtifactFormat.PDF));

        mvc.perform(post("/api/v1/invoices/{id}/generate", invoiceId)
                .param("format", "PDF"))
            .andExpect(status().isConflict());
    }

    @Test
    @WithMockUser
    void generate_returns_404_when_invoice_missing() throws Exception {
        when(artifactService.generate(any(), any(), eq(false)))
            .thenThrow(new InvoiceNotFoundException(invoiceId));

        mvc.perform(post("/api/v1/invoices/{id}/generate", invoiceId))
            .andExpect(status().isNotFound());
    }

    @Test
    void generate_returns_401_without_auth() throws Exception {
        mvc.perform(post("/api/v1/invoices/{id}/generate", invoiceId))
            .andExpect(status().isUnauthorized());
    }

    // ===== /generated =====

    @Test
    @WithMockUser
    void streamGenerated_returns_bytes() throws Exception {
        when(artifactService.streamGenerated(invoiceId, ArtifactFormat.PDF))
            .thenReturn("saved-pdf".getBytes());

        mvc.perform(get("/api/v1/invoices/{id}/generated", invoiceId)
                .param("format", "PDF"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(MediaType.APPLICATION_PDF))
            .andExpect(header().string("Cache-Control", "private, no-store"))
            .andExpect(header().string("Content-Disposition",
                org.hamcrest.Matchers.containsString("attachment")))
            .andExpect(content().bytes("saved-pdf".getBytes()));
    }

    @Test
    @WithMockUser
    void streamGenerated_returns_404_when_missing() throws Exception {
        when(artifactService.streamGenerated(invoiceId, ArtifactFormat.PDF))
            .thenThrow(new GeneratedArtifactNotFoundException(invoiceId, ArtifactFormat.PDF));

        mvc.perform(get("/api/v1/invoices/{id}/generated", invoiceId)
                .param("format", "PDF"))
            .andExpect(status().isNotFound());
    }

    @Test
    void streamGenerated_returns_401_without_auth() throws Exception {
        mvc.perform(get("/api/v1/invoices/{id}/generated", invoiceId))
            .andExpect(status().isUnauthorized());
    }

    // ===== /generated/metadata =====

    @Test
    @WithMockUser
    void metadata_returns_both_formats_or_nulls() throws Exception {
        var metadata = new com.example.invoicetracker.adapter.web.invoice.dto
            .InvoiceArtifactsMetadataResponse(null, null);
        when(artifactService.metadata(invoiceId)).thenReturn(metadata);

        mvc.perform(get("/api/v1/invoices/{id}/generated/metadata", invoiceId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.pdf").doesNotExist())
            .andExpect(jsonPath("$.docx").doesNotExist());
    }

    @Test
    @WithMockUser
    void metadata_returns_404_when_invoice_missing() throws Exception {
        when(artifactService.metadata(invoiceId))
            .thenThrow(new InvoiceNotFoundException(invoiceId));

        mvc.perform(get("/api/v1/invoices/{id}/generated/metadata", invoiceId))
            .andExpect(status().isNotFound());
    }

    @Test
    void metadata_returns_401_without_auth() throws Exception {
        mvc.perform(get("/api/v1/invoices/{id}/generated/metadata", invoiceId))
            .andExpect(status().isUnauthorized());
    }
}
