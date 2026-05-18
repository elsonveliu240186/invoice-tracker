package com.example.invoicetracker.application.company;

import com.example.invoicetracker.domain.company.CompanyProfile;
import com.example.invoicetracker.domain.company.CompanyProfileRepository;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Application service for company profile use-cases: get and update.
 */
@Service
public class CompanyProfileService {

    private static final Logger log = LoggerFactory.getLogger(CompanyProfileService.class);

    private final CompanyProfileRepository repository;

    public CompanyProfileService(CompanyProfileRepository repository) {
        this.repository = repository;
    }

    /**
     * Returns the persisted company profile, or an empty-strings default if the row
     * has not been populated yet.
     *
     * @return the current company profile
     */
    @Transactional(readOnly = true)
    public CompanyProfile get() {
        return repository.find()
            .orElseGet(() -> new CompanyProfile(
                "", "", "", "", "", "", "", "", Instant.now()));
    }

    /**
     * Upserts the company profile and returns the saved state.
     *
     * <p>Logs field names updated (INFO level) but never logs the field values,
     * since they may contain PII (email), financial identifiers (IBAN, VAT),
     * or bank routing codes (SWIFT/BIC).
     *
     * @param profile the updated profile
     * @return the persisted profile
     */
    @Transactional
    public CompanyProfile update(CompanyProfile profile) {
        log.info("Company profile update requested for fields: "
            + "name, address, phone, email, vatNumber, iban, swiftBic, bankName");
        CompanyProfile saved = repository.save(profile);
        log.info("Company profile updated successfully");
        return saved;
    }
}
