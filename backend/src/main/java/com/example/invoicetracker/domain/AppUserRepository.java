package com.example.invoicetracker.domain;

import java.util.Optional;

/**
 * Domain port for AppUser persistence operations.
 */
public interface AppUserRepository {

    Optional<AppUser> findByEmail(String email);

    AppUser save(AppUser user);

    boolean existsByEmail(String email);
}
