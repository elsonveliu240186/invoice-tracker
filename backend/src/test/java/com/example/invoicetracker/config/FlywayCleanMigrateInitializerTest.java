package com.example.invoicetracker.config;

import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.mockito.InOrder;
import org.springframework.boot.flyway.autoconfigure.FlywayMigrationStrategy;

class FlywayCleanMigrateInitializerTest {

    @Test
    void strategy_calls_clean_then_migrate_in_order() {
        FlywayCleanMigrateInitializer initializer = new FlywayCleanMigrateInitializer();
        FlywayMigrationStrategy strategy = initializer.cleanMigrateStrategy();

        Flyway flyway = mock(Flyway.class);
        strategy.migrate(flyway);

        InOrder order = inOrder(flyway);
        order.verify(flyway).clean();
        order.verify(flyway).migrate();
        order.verifyNoMoreInteractions();
    }
}
