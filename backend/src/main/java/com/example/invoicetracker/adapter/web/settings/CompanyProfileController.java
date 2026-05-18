package com.example.invoicetracker.adapter.web.settings;

import com.example.invoicetracker.adapter.web.settings.dto.CompanyProfileRequest;
import com.example.invoicetracker.adapter.web.settings.dto.CompanyProfileResponse;
import com.example.invoicetracker.application.company.CompanyProfileService;
import com.example.invoicetracker.domain.company.CompanyProfile;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.time.Instant;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * REST controller for company profile settings at {@code /api/v1/settings/company}.
 */
@RestController
@RequestMapping("/api/v1/settings/company")
@Tag(name = "Settings", description = "Company profile management")
public class CompanyProfileController {

    private final CompanyProfileService service;

    public CompanyProfileController(CompanyProfileService service) {
        this.service = service;
    }

    /**
     * Returns the current company profile.
     *
     * @return 200 with company profile response
     */
    @GetMapping
    @Operation(summary = "Get the company profile")
    public ResponseEntity<CompanyProfileResponse> get() {
        CompanyProfile profile = service.get();
        return ResponseEntity.ok(toResponse(profile));
    }

    /**
     * Updates the company profile.
     *
     * @param request the validated request body
     * @return 200 with the updated company profile response
     */
    @PutMapping
    @Operation(summary = "Update the company profile")
    public ResponseEntity<CompanyProfileResponse> update(
        @Valid @RequestBody CompanyProfileRequest request
    ) {
        CompanyProfile profile = new CompanyProfile(
            request.name(),
            request.address(),
            request.phone(),
            request.email(),
            request.vatNumber(),
            request.iban(),
            request.swiftBic(),
            request.bankName(),
            Instant.now()
        );
        CompanyProfile saved = service.update(profile);
        return ResponseEntity.ok(toResponse(saved));
    }

    private CompanyProfileResponse toResponse(CompanyProfile profile) {
        return new CompanyProfileResponse(
            profile.name(),
            profile.address(),
            profile.phone(),
            profile.email(),
            profile.vatNumber(),
            profile.iban(),
            profile.swiftBic(),
            profile.bankName(),
            profile.updatedAt()
        );
    }
}
