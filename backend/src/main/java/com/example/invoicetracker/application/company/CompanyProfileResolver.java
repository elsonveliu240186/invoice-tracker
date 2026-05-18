package com.example.invoicetracker.application.company;

import com.example.invoicetracker.application.invoice.CompanyProperties;
import com.example.invoicetracker.domain.company.CompanyProfile;
import com.example.invoicetracker.domain.company.CompanyProfileRepository;
import java.time.Instant;
import java.util.Optional;
import org.springframework.stereotype.Component;

/**
 * Resolves the effective {@link CompanyProperties} for invoice rendering.
 *
 * <p>Precedence (highest to lowest):
 * <ol>
 *   <li>Persisted {@link CompanyProfile} row — any non-blank field wins.
 *   <li>YAML-bound {@link CompanyProperties} — used when the persisted field is blank.
 *   <li>Empty string — final fallback for any field not configured anywhere.
 * </ol>
 *
 * <p>Returns a {@link CompanyProperties} shape so that
 * {@link com.example.invoicetracker.application.invoice.PoiTlInvoiceDocxRenderer}
 * does not need to be changed.
 */
@Component
public class CompanyProfileResolver {

    private final CompanyProfileRepository repository;
    private final CompanyProperties yamlProperties;

    public CompanyProfileResolver(
        CompanyProfileRepository repository,
        CompanyProperties yamlProperties
    ) {
        this.repository = repository;
        this.yamlProperties = yamlProperties;
    }

    /**
     * Resolves the effective company properties by merging the persisted profile
     * with the YAML fallback.
     *
     * @return the resolved {@link CompanyProperties}
     */
    public CompanyProperties resolve() {
        Optional<CompanyProfile> persisted = repository.find();
        if (persisted.isEmpty()) {
            return yamlProperties;
        }
        CompanyProfile p = persisted.get();
        return new CompanyProperties(
            firstNonBlank(p.name(),      yamlProperties.name()),
            firstNonBlank(p.address(),   yamlProperties.address()),
            firstNonBlank(p.email(),     yamlProperties.email()),
            yamlProperties.taxId(),
            firstNonBlank(p.vatNumber(), yamlProperties.vatNumber()),
            firstNonBlank(p.iban(),      yamlProperties.iban()),
            firstNonBlank(p.swiftBic(),  yamlProperties.swiftBic()),
            firstNonBlank(p.bankName(),  yamlProperties.bankName())
        );
    }

    /**
     * Builds a {@link CompanyProfile} from the persisted row, falling back to YAML
     * defaults for any blank field. This is used to pre-populate the settings form.
     *
     * @return the resolved company profile
     */
    public CompanyProfile resolveProfile() {
        Optional<CompanyProfile> persisted = repository.find();
        CompanyProfile p = persisted.orElseGet(
            () -> new CompanyProfile("", "", "", "", "", "", "", "", Instant.now()));
        return new CompanyProfile(
            firstNonBlank(p.name(),      yamlProperties.name()),
            firstNonBlank(p.address(),   yamlProperties.address()),
            firstNonBlank(p.phone(),     ""),
            firstNonBlank(p.email(),     yamlProperties.email()),
            firstNonBlank(p.vatNumber(), yamlProperties.vatNumber()),
            firstNonBlank(p.iban(),      yamlProperties.iban()),
            firstNonBlank(p.swiftBic(),  yamlProperties.swiftBic()),
            firstNonBlank(p.bankName(),  yamlProperties.bankName()),
            p.updatedAt()
        );
    }

    private String firstNonBlank(String... candidates) {
        for (String c : candidates) {
            if (c != null && !c.isBlank()) {
                return c;
            }
        }
        return "";
    }
}
