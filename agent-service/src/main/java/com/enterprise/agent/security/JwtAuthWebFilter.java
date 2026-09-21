// This file belongs to the security package
package com.enterprise.agent.security;

// Lets us pick HTTP status codes like 401
import org.springframework.http.HttpStatus;
// Marks a value as "never null"
import org.springframework.lang.NonNull;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;
// The request and response together
import org.springframework.web.server.ServerWebExchange;
// The type for a filter that runs on every request
import org.springframework.web.server.WebFilter;
// The rest of the filters
import org.springframework.web.server.WebFilterChain;
// Mono means "a result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;

// Makes this class a Spring-managed object
@Component
// This filter checks the JWT on every request to the agent service
public class JwtAuthWebFilter implements WebFilter {

    // Reads and checks tokens
    private final JwtUtil jwtUtil;

    // Spring gives us the helper when it creates this class
    public JwtAuthWebFilter(JwtUtil jwtUtil) {
        // Save the helper
        this.jwtUtil = jwtUtil;
    }

    // This runs for every request
    @Override
    @NonNull
    public Mono<Void> filter(@NonNull ServerWebExchange exchange, @NonNull WebFilterChain chain) {
        // Get the URL path of the request
        String path = exchange.getRequest().getPath().value();

        // Actuator health checks don't need auth
        // (Docker checks health without a token)
        if (path.startsWith("/actuator")) {
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

            // Attach userId and role to exchange attributes — controllers read these
            // Save the user id from the token
            exchange.getAttributes().put("userId", jwtUtil.extractUserId(token));
            // Save the email from the token
            exchange.getAttributes().put("userEmail", jwtUtil.extractUsername(token));
            // Save the role from the token
            exchange.getAttributes().put("userRole", jwtUtil.extractRole(token));

            // Send the request on to the controller
            return chain.filter(exchange);
        } catch (Exception e) {
            // Any problem reading the token means we don't trust it, so send 401
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            // Send the response now and stop
            return exchange.getResponse().setComplete();
        }
    }
}
