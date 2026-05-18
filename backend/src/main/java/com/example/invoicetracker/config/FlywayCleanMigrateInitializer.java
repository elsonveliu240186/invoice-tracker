package com.example.invoicetracker.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

/**
 * Flyway migration strategy for the {@code e2e} profile.
 *
 * <p>Runs {@code flyway.clean()} before {@code flyway.migrate()} to guarantee a
 * completely fresh schema on every container start. This is intentional and safe
 * because the {@code e2e} profile is used exclusively by the automated E2E test
 * environment (never in production or staging).
 *
 * <p>{@code spring.flyway.clean-disabled} must be set to {@code false} in the
 * {@code e2e} profile YAML document for this strategy to work.
 */
@Configuration
@Profile("e2e")
public class FlywayCleanMigrateInitializer {

    private static final Logger log =
        LoggerFactory.getLogger(FlywayCleanMigrateInitializer.class);

    /**
     * Returns a {@link FlywayMigrationStrategy} that cleans and then migrates the schema.
     *
     * @return the clean-then-migrate strategy
     */
    @Bean
    public FlywayMigrationStrategy cleanMigrateStrategy() {
        return flyway -> {
            log.info("E2E profile active — running Flyway clean+migrate for a fresh schema");
            flyway.clean();
            flyway.migrate();
            log.info("Flyway clean+migrate complete");
        };
    }
}
