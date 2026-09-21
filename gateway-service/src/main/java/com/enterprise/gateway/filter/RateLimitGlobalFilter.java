// This file belongs to the filter package
package com.enterprise.gateway.filter;

// Counts a user's requests in Redis
import com.enterprise.gateway.service.RateLimitService;
// Gives us each team's limit
import com.enterprise.gateway.service.TeamConfigService;
// The rest of the filters
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
// The type for a filter that runs on every request
import org.springframework.cloud.gateway.filter.GlobalFilter;
// Lets us choose the order filters run in
import org.springframework.core.Ordered;
// Lets us pick HTTP status codes like 429
import org.springframework.http.HttpStatus;
// Makes this class a Spring-managed object
import org.springframework.stereotype.Component;
// The request and response together
import org.springframework.web.server.ServerWebExchange;
// Mono means "a result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;
// Lets us pick which thread runs some work
import reactor.core.scheduler.Schedulers;

/**
 * Runs second (order = -1), after JwtGlobalFilter sets the userId attribute.
 * Checks Redis sliding window — returns 429 with Retry-After if over limit.
 */
// Makes this class a Spring-managed object
@Component
// This filter stops users who send too many requests
public class RateLimitGlobalFilter implements GlobalFilter, Ordered {

    // Does the counting in Redis
    private final RateLimitService rateLimitService;
    // Knows the limit for each team
    private final TeamConfigService teamConfigService;

    // Spring gives us both helpers when it creates this class
    public RateLimitGlobalFilter(RateLimitService rateLimitService, TeamConfigService teamConfigService) {
        // Save the rate limit helper
        this.rateLimitService = rateLimitService;
        // Save the team settings helper
        this.teamConfigService = teamConfigService;
    }

    // Tells Spring when to run this filter (lower numbers run first)
    @Override
    public int getOrder() {
        return -1;  // runs after JwtGlobalFilter (-2)
    }

    // This runs for every request that comes through the gateway
    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        // Get the URL path of the request
        String path = exchange.getRequest().getPath().value();

        // Skip rate limiting for auth and actuator endpoints
        // (these have no logged-in user to count)
        if (path.startsWith("/auth/register") || path.startsWith("/auth/login")
                || path.startsWith("/auth/refresh") || path.startsWith("/actuator")) {
            // Let the request through without counting
            return chain.filter(exchange);
        }

        // Get the user id the JWT filter saved
        String userId = exchange.getAttribute("userId");
        // Get the team id the JWT filter saved (or "default")
        String teamId = exchange.getAttributeOrDefault("teamId", "default");

        // If there is no user id, we have nobody to count
        if (userId == null) {
            // JWT filter already rejected unauthenticated requests — this shouldn't happen
            return chain.filter(exchange);
        }

        // Fetch the team's rate limit from Postgres (blocking call on bounded elastic thread)
        // Run the database lookup later, when a thread is ready
        return Mono.fromCallable(() -> teamConfigService.getRequestsPerHour(teamId))
                // The database call blocks, so run it on a thread meant for blocking work
                .subscribeOn(Schedulers.boundedElastic())
                // Ask Redis if this user is still under their limit
                .flatMap(limit -> rateLimitService.isAllowed(userId, limit))
                // Now act on the answer
                .flatMap(allowed -> {
                    // If the user is under the limit, let the request through
                    if (allowed) {
                        // Send the request on to the service
                        return chain.filter(exchange);
                    }
                    // Rate limited — respond with 429 and Retry-After header
                    // Set the status to 429 (Too Many Requests)
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    // Tell the client to wait 3600 seconds (1 hour) before trying again
                    exchange.getResponse().getHeaders().set("Retry-After", "3600");
                    // Tell the client what the limit is
                    exchange.getResponse().getHeaders().set("X-RateLimit-Limit",
                            String.valueOf(teamConfigService.getRequestsPerHour(teamId)));
                    // Send the response now and stop
                    return exchange.getResponse().setComplete();
                });
    }
}
