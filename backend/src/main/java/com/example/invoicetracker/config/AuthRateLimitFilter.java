package com.example.invoicetracker.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Rate-limits authentication endpoints per IP per minute.
 * Capacity defaults to 5 in production; override via {@code app.auth.rate-limit.capacity}.
 * Applies to /api/v1/auth/login and /api/v1/auth/register only.
 */
@Component
public class AuthRateLimitFilter extends OncePerRequestFilter {

    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

    private final int capacity;
    private final Map<String, Bucket> buckets = new ConcurrentHashMap<>();

    public AuthRateLimitFilter(
        @Value("${app.auth.rate-limit.capacity:5}") int capacity
    ) {
        this.capacity = capacity;
    }

    @Override
    protected void doFilterInternal(
        @NonNull HttpServletRequest request,
        @NonNull HttpServletResponse response,
        @NonNull FilterChain chain
    ) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (isAuthEndpoint(path)) {
            String ip = resolveClientIp(request);
            Bucket bucket = buckets.computeIfAbsent(ip, k -> newBucket());
            if (!bucket.tryConsume(1)) {
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                response.getWriter().write(
                    "{\"status\":429,\"title\":\"Too Many Requests\","
                    + "\"detail\":\"Rate limit exceeded. Try again in 1 minute.\","
                    + "\"code\":\"RATE_LIMIT_EXCEEDED\"}"
                );
                return;
            }
        }
        chain.doFilter(request, response);
    }

    private boolean isAuthEndpoint(String path) {
        return path.equals("/api/v1/auth/login")
            || path.equals("/api/v1/auth/register");
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private Bucket newBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.classic(capacity, Refill.intervally(capacity, REFILL_PERIOD)))
            .build();
    }
}
