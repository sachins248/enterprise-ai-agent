// This file belongs to the filter package
package com.enterprise.gateway.filter;

// Our helper that reads tokens
import com.enterprise.gateway.security.JwtUtil;
// The rest of the filters
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
// The type for a filter that runs on every request
import org.springframework.cloud.gateway.filter.GlobalFilter;
// Lets us choose the order filters run in
import org.springframework.core.Ordered;
// Lets us pick HTTP status codes like 401
import org.springframework.http.HttpStatus;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;
// The request and response together
import org.springframework.web.server.ServerWebExchange;
// Mono means "a result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;

/**
 * Runs first (order = -2) on every proxied request.
 * Validates the JWT and injects X-User-Id / X-User-Role headers so
 * downstream services can trust the caller's identity without re-parsing tokens.
 */
// Makes this class a Spring-managed object
@Component
// This filter checks the token once at the front door so the other services don't have to
public class JwtGlobalFilter implements GlobalFilter, Ordered {

    // Reads and checks tokens
    private final JwtUtil jwtUtil;

    // Spring gives us the helper when it creates this class
    public JwtGlobalFilter(JwtUtil jwtUtil) {
        // Save the helper
        this.jwtUtil = jwtUtil;
    }

    // Tells Spring when to run this filter (lower numbers run first)
    @Override
    public int getOrder() {
        return -2;  // runs before RateLimitGlobalFilter (-1)
    }

    // This runs for every request that comes through the gateway
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Get the URL path of the request
        String path = exchange.getRequest().getPath().value();

        // Skip JWT check for auth endpoints and actuator health checks
        // (people can't have a token before they log in)
        if (path.startsWith("/auth/register") || path.startsWith("/auth/login")
                || path.startsWith("/auth/refresh") || path.startsWith("/actuator")) {
            // Let the request through without checking
            return chain.filter(exchange);
        }

        // Read the Authorization header (it should look like "Bearer <token>")
        String authHeader = exchange.getRequest().getHeaders().getFirst("Authorization");
        // If there is no Bearer token, reject the request
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            // Set the status to 401 (Unauthorized)
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            // Send the response now and stop
            return exchange.getResponse().setComplete();
        }

        // Cut off the first 7 characters ("Bearer ") to get just the token
        String token = authHeader.substring(7);
        // Wrap in try because a bad token throws an error
        try {
            // Check that the token is real and not expired
            if (!jwtUtil.isTokenValid(token)) {
                // Set the status to 401 (Unauthorized)
                exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
                // Send the response now and stop
                return exchange.getResponse().setComplete();
            }

            // Read the user id from the token
            String userId = jwtUtil.extractUserId(token);
            // Read the role from the token
            String role = jwtUtil.extractRole(token);
            // Read the team id from the token (it can be null)
            String teamId = jwtUtil.extractTeamId(token);

            // Store for the rate limiter filter (next in chain)
            // Save the user id so the next filter can use it
            exchange.getAttributes().put("userId", userId);
            // Save the role so the next filter can use it
            exchange.getAttributes().put("userRole", role);
            // Save the team id, or "default" if the user has no team
            exchange.getAttributes().put("teamId", teamId != null ? teamId : "default");

            // Mutate the request to add identity headers for downstream services
            // (we make a changed copy because the original request can't be edited)
            ServerWebExchange mutatedExchange = exchange.mutate()
                    // Change the request headers
                    .request(r -> r.headers(headers -> {
                        // Tell the next service who the user is
                        headers.set("X-User-Id", userId);
                        // Tell the next service what the user's role is
                        headers.set("X-User-Role", role);
                        // Tell the next service the team, only if there is one
                        if (teamId != null) headers.set("X-Team-Id", teamId);
                    }))
                    // Build the changed copy
                    .build();

            // Send the changed request on to the service
            return chain.filter(mutatedExchange);

        } catch (Exception e) {
            // Any problem reading the token means we don't trust it, so send 401
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            // Send the response now and stop
            return exchange.getResponse().setComplete();
        }
    }
}
