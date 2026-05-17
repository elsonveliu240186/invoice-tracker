package com.example.invoicetracker.adapter.web.settings;

import com.example.invoicetracker.adapter.web.settings.dto.TemplateMetadataResponse;
import com.example.invoicetracker.adapter.web.settings.dto.UploadTemplateResponse;
import com.example.invoicetracker.application.template.InvalidTemplateException;
import com.example.invoicetracker.application.template.InvoiceTemplateProperties;
import com.example.invoicetracker.application.template.InvoiceTemplateStore;
import com.example.invoicetracker.application.template.TemplateTooLargeException;
import com.example.invoicetracker.application.template.TemplateMetadata;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.io.IOException;
import java.net.URI;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * REST controller for invoice template management at
 * {@code /api/v1/settings/invoice-template}.
 */
@RestController
@RequestMapping("/api/v1/settings/invoice-template")
@Tag(name = "Settings", description = "Invoice template upload, preview, and download")
public class InvoiceTemplateController {

    private static final Logger log = LoggerFactory.getLogger(InvoiceTemplateController.class);

    private static final String DOCX_MEDIA_TYPE =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

    private final InvoiceTemplateStore templateStore;
    private final InvoiceTemplateProperties templateProperties;

    /**
     * Constructs the controller.
     *
     * @param templateStore      the template store
     * @param templateProperties configuration properties (for max-size validation)
     */
    public InvoiceTemplateController(
        InvoiceTemplateStore templateStore,
        InvoiceTemplateProperties templateProperties
    ) {
        this.templateStore = templateStore;
        this.templateProperties = templateProperties;
    }

    /**
     * Accepts a {@code .docx} template upload (multipart/form-data).
     *
     * <p>Validates: size ≤ max-template-bytes, extension ".docx", content-type whitelist,
     * ZIP magic bytes, presence of {@code word/document.xml}, absence of external refs.
     *
     * @param file the uploaded file (field name {@code file})
     * @return 200 with upload metadata, 400/413/415 on validation errors
     */
    @PostMapping
    @Operation(summary = "Upload a new DOCX invoice template")
    public ResponseEntity<?> upload(
        @RequestParam(value = "file", required = false) MultipartFile file
    ) throws IOException {
        if (file == null || file.isEmpty()) {
            ProblemDetail problem = ProblemDetail.forStatus(HttpStatus.BAD_REQUEST);
            problem.setType(URI.create("about:blank"));
            problem.setTitle("Bad Request");
            problem.setDetail("Required request part 'file' is not present.");
            problem.setProperty("code", "MISSING_REQUEST_PART");
            return ResponseEntity.badRequest().body(problem);
        }

        // Size check (before reading all bytes)
        long size = file.getSize();
        if (size > templateProperties.maxTemplateBytes()) {
            throw new TemplateTooLargeException(size, templateProperties.maxTemplateBytes());
        }

        // Extension whitelist
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || !originalFilename.toLowerCase().endsWith(".docx")) {
            throw new InvalidTemplateException(
                "only .docx files are accepted, got: " + originalFilename);
        }

        // Content-type whitelist
        String contentType = file.getContentType();
        if (contentType != null
            && !contentType.equals(DOCX_MEDIA_TYPE)
            && !contentType.equals(MediaType.APPLICATION_OCTET_STREAM_VALUE)) {
            throw new InvalidTemplateException(
                "unsupported content type: " + contentType);
        }

        log.info("Template upload request: filename={} size={}", originalFilename, size);
        TemplateMetadata meta = templateStore.replace(file.getInputStream(), size);

        return ResponseEntity.ok(new UploadTemplateResponse(
            meta.filename(), meta.sizeBytes(), meta.uploadedAt()));
    }

    /**
     * Returns metadata of the active template.
     *
     * @return 200 with metadata JSON
     */
    @GetMapping("/preview")
    @Operation(summary = "Get active template metadata")
    public ResponseEntity<TemplateMetadataResponse> preview() {
        TemplateMetadata meta = templateStore.getMetadata();
        return ResponseEntity.ok(new TemplateMetadataResponse(
            meta.filename(), meta.sizeBytes(), meta.uploadedAt(), meta.isDefault()));
    }

    /**
     * Streams the active template DOCX for download.
     *
     * @return 200 with DOCX bytes and Content-Disposition attachment header
     */
    @GetMapping("/download")
    @Operation(summary = "Download the active invoice template")
    public ResponseEntity<byte[]> download() throws IOException { // NOSONAR TemplateNotFoundException is unchecked
        byte[] bytes = templateStore.openTemplate().readAllBytes();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"invoice-template.docx\"")
            .header(HttpHeaders.CACHE_CONTROL, "private, no-store")
            .contentType(MediaType.parseMediaType(DOCX_MEDIA_TYPE))
            .contentLength(bytes.length)
            .body(bytes);
    }
}
