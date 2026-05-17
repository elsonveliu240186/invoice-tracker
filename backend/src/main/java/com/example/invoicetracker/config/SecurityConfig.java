package com.example.invoicetracker.config;

import com.example.invoicetracker.domain.AppUserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Security configuration: HTTP Basic for all /api/v1/** endpoints.
 * Auth endpoints (/api/v1/auth/**) are publicly accessible.
 * CSRF is disabled for the API paths because the SPA uses HTTP Basic (stateless).
 */
@Configuration
public class SecurityConfig {

    @Value("${spring.security.user.name:user}")
    private String defaultUserName;

    @Value("${spring.security.user.password:}")
    private String defaultUserPassword;

    @Bean
    public SecurityFilterChain filterChain(
        HttpSecurity http,
        AuthRateLimitFilter authRateLimitFilter
    ) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .addFilterBefore(authRateLimitFilter, UsernamePasswordAuthenticationFilter.class)
            .authorizeHttpRequests(authz -> authz
                .requestMatchers(
                    "/api/v1/auth/**",
                    "/v3/api-docs/**",
                    "/swagger-ui/**",
                    "/swagger-ui.html",
                    "/actuator/health",
                    "/actuator/info"
                ).permitAll()
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> {})
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
            );
        return http.build();
    }

    /**
     * BCrypt password encoder with cost factor 12.
     *
     * @return the PasswordEncoder bean
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    /**
     * UserDetailsService backed by AppUserRepository with an in-memory fallback
     * for the {@code spring.security.user} credentials (used by integration tests
     * and local development).
     *
     * @param appUserRepository the user repository
     * @param encoder           the password encoder used to hash the fallback password
     * @return the UserDetailsService bean
     */
    @Bean
    public UserDetailsService userDetailsService(
        AppUserRepository appUserRepository,
        PasswordEncoder encoder
    ) {
        InMemoryUserDetailsManager inMemory = buildInMemoryManager(encoder);

        return username -> {
            try {
                return inMemory.loadUserByUsername(username);
            } catch (UsernameNotFoundException notInMemory) {
                return appUserRepository.findByEmail(username)
                    .map(user -> (UserDetails) User.withUsername(user.email())
                        .password(user.passwordHash())
                        .roles("USER")
                        .build())
                    .orElseThrow(() ->
                        new UsernameNotFoundException("User not found: " + username));
            }
        };
    }

    private InMemoryUserDetailsManager buildInMemoryManager(PasswordEncoder encoder) {
        if (defaultUserPassword == null || defaultUserPassword.isEmpty()) {
            return new InMemoryUserDetailsManager();
        }
        UserDetails details = User
            .withUsername(defaultUserName)
            .password(encoder.encode(defaultUserPassword))
            .roles("USER")
            .build();
        return new InMemoryUserDetailsManager(details);
    }
}
