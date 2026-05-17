package com.example.invoicetracker.adapter.web.settings;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.invoicetracker.Application;
import com.example.invoicetracker.application.template.InvalidTemplateException;
import com.example.invoicetracker.application.template.InvoiceTemplateStore;
import com.example.invoicetracker.application.template.TemplateTooLargeException;
import com.example.invoicetracker.application.template.TemplateMetadata;
import com.example.invoicetracker.support.TemplateFixtures;
import java.io.ByteArrayInputStream;
import java.time.Instant;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
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
class InvoiceTemplateControllerTest {

    @Container
    @ServiceConnection
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16");

    @Autowired
    WebApplicationContext context;

    @MockitoBean
    InvoiceTemplateStore templateStore;

    MockMvc mvc;

    private TemplateMetadata sampleMeta;

    @BeforeEach
    void setUp() {
        mvc = MockMvcBuilders
            .webAppContextSetup(context)
            .apply(SecurityMockMvcConfigurers.springSecurity())
            .build();

        sampleMeta = new TemplateMetadata(
            "invoice-template.docx", 12345L, Instant.parse("2026-05-13T20:10:00Z"), false);
    }

    @Test
    @WithMockUser
    void upload_valid_returns_200() throws Exception {
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        MockMultipartFile file = new MockMultipartFile(
            "file", "invoice-template.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            docxBytes);

        when(templateStore.replace(any(), anyLong())).thenReturn(sampleMeta);

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file)
                .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.filename").value("invoice-template.docx"))
            .andExpect(jsonPath("$.size").value(12345));
    }

    @Test
    @WithMockUser
    void upload_non_docx_returns_415() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "invoice.pdf",
            "application/pdf",
            "fake pdf content".getBytes());

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file))
            .andExpect(status().isUnsupportedMediaType())
            .andExpect(jsonPath("$.code").value("INVALID_TEMPLATE_TYPE"));
    }

    @Test
    @WithMockUser
    void upload_over_5mb_returns_413() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
            "file", "invoice-template.docx",
            "application/octet-stream",
            new byte[6 * 1024 * 1024] // 6 MB
        );

        when(templateStore.replace(any(), anyLong()))
            .thenThrow(new TemplateTooLargeException(6L * 1024 * 1024, 5_242_880L));

        // Controller validates size first based on MultipartFile.getSize()
        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file))
            .andExpect(status().isPayloadTooLarge())
            .andExpect(jsonPath("$.code").value("TEMPLATE_TOO_LARGE"));
    }

    @Test
    @WithMockUser
    void upload_missing_field_returns_400() throws Exception {
        // No "file" part — Spring should return 400
        mvc.perform(multipart("/api/v1/settings/invoice-template"))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void upload_invalid_docx_returns_415() throws Exception {
        byte[] notDocx = TemplateFixtures.notADocx();
        MockMultipartFile file = new MockMultipartFile(
            "file", "invoice-template.docx",
            "application/octet-stream",
            notDocx);

        when(templateStore.replace(any(), anyLong()))
            .thenThrow(new InvalidTemplateException("wrong magic bytes"));

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file))
            .andExpect(status().isUnsupportedMediaType())
            .andExpect(jsonPath("$.code").value("INVALID_TEMPLATE_TYPE"));
    }

    @Test
    @WithMockUser
    void preview_returns_metadata() throws Exception {
        when(templateStore.getMetadata()).thenReturn(sampleMeta);

        mvc.perform(get("/api/v1/settings/invoice-template/preview"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.filename").value("invoice-template.docx"))
            .andExpect(jsonPath("$.size").value(12345))
            .andExpect(jsonPath("$.isDefault").value(false));
    }

    @Test
    @WithMockUser
    void download_returns_docx_media_type() throws Exception {
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        when(templateStore.openTemplate())
            .thenReturn(new ByteArrayInputStream(docxBytes));

        mvc.perform(get("/api/v1/settings/invoice-template/download"))
            .andExpect(status().isOk())
            .andExpect(content().contentType(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
            .andExpect(result -> {
                String disposition = result.getResponse()
                    .getHeader("Content-Disposition");
                assert disposition != null && disposition.contains("attachment");
            });
    }

    @Test
    void requires_auth() throws Exception {
        mvc.perform(get("/api/v1/settings/invoice-template/preview"))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
    void upload_with_octet_stream_content_type_and_docx_extension_accepted() throws Exception {
        // Cover: contentType != null && !equals(DOCX) but equals(OCTET_STREAM) → skip block
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        MockMultipartFile file = new MockMultipartFile(
            "file", "invoice-template.docx",
            MediaType.APPLICATION_OCTET_STREAM_VALUE,
            docxBytes);

        when(templateStore.replace(any(), anyLong())).thenReturn(sampleMeta);

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file)
                .contentType(MediaType.MULTIPART_FORM_DATA))
            .andExpect(status().isOk());
    }

    @Test
    @WithMockUser
    void upload_empty_file_returns_400() throws Exception {
        // Cover: file.isEmpty() → true branch in `file == null || file.isEmpty()`
        MockMultipartFile emptyFile = new MockMultipartFile(
            "file", "invoice-template.docx",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new byte[0]);

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(emptyFile))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser
    void upload_null_filename_returns_415() throws Exception {
        // Cover: originalFilename == null branch in extension whitelist
        MockMultipartFile file = new MockMultipartFile(
            "file", null, // null original filename
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            new byte[]{0x50, 0x4B, 0x03, 0x04, 0x00});

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file))
            .andExpect(status().isUnsupportedMediaType());
    }

    @Test
    @WithMockUser
    void upload_with_null_content_type_accepted_when_docx_extension() throws Exception {
        // Cover: contentType == null → condition is false → accepted (if extension passes)
        byte[] docxBytes = TemplateFixtures.minimalDocx();
        MockMultipartFile file = new MockMultipartFile(
            "file", "invoice-template.docx",
            null, // null content type
            docxBytes);

        when(templateStore.replace(any(), anyLong())).thenReturn(sampleMeta);

        mvc.perform(multipart("/api/v1/settings/invoice-template")
                .file(file))
            .andExpect(status().isOk());
    }
}
