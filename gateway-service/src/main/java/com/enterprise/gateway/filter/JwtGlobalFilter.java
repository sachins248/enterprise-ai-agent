package com.enterprise.gateway.filter;

import com.enterprise.gateway.security.JwtUtil;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

/**
 * Runs first (order = -2) on every proxied request.
 * Validates the JWT and injects X-User-Id / X-User-Role headers so
 * downstream services can trust the caller's identity without re-parsing tokens.
 */
@Component
public class JwtGlobalFilter implements GlobalFilter, Ordered {

    private final JwtUtil jwtUtil;

    public JwtGlobalFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public int getOrder() {
        return -2;  // runs before RateLimitGlobalFilter (-1)
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip JWT check for auth endpoints and actuator health checks
        if (path.startsWith("/auth/register") || path.startsWith("/auth/login")
                || path.startsWith("/auth/refresh") || path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);
        try {
            if (!jwtUtil.isTokenValid(token)) {
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                return exchange.getResponse().setComplete();
            }

            String userId = jwtUtil.extractUserId(token);
            String role = jwtUtil.extractRole(token);
            String teamId = jwtUtil.extractTeamId(token);

            // Store for the rate limiter filter (next in chain)
            exchange.getAttributes().put("userId", userId);
            exchange.getAttributes().put("userRole", role);
            exchange.getAttributes().put("teamId", teamId != null ? teamId : "default");

            // Mutate the request to add identity headers for downstream services
            ServerWebExchange mutatedExchange = exchange.mutate()
                    .request(r -> r.headers(headers -> {
                        headers.set("X-User-Id", userId);
                        headers.set("X-User-Role", role);
                        if (teamId != null) headers.set("X-Team-Id", teamId);
                    }))
                    .build();

            return chain.filter(mutatedExchange);

        } catch (Exception e) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
