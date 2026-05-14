package com.example.invoicetracker.config;

import java.time.Clock;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * General application configuration beans.
 */
@Configuration
public class AppConfig {

    /**
     * Provides the system UTC clock as a Spring bean.
     *
     * @return UTC system clock
     */
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
