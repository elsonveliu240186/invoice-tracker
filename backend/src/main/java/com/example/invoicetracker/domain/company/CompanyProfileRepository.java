package com.example.invoicetracker.domain.company;

import java.util.Optional;

/**
 * Port for persisting and retrieving the singleton {@link CompanyProfile}.
 */
public interface CompanyProfileRepository {

    /**
     * Returns the persisted company profile, if one exists.
     *
     * @return the profile wrapped in an Optional, or empty if the row has never been written
     */
    Optional<CompanyProfile> find();

    /**
     * Upserts the singleton company profile row.
     *
     * @param profile the profile to persist
     * @return the saved profile (with updated timestamp)
     */
    CompanyProfile save(CompanyProfile profile);
}
