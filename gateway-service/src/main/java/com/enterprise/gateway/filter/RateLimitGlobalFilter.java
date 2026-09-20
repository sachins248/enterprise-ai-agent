package com.enterprise.gateway.filter;

import com.enterprise.gateway.service.RateLimitService;
import com.enterprise.gateway.service.TeamConfigService;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

/**
 * Runs second (order = -1), after JwtGlobalFilter sets the userId attribute.
 * Checks Redis sliding window — returns 429 with Retry-After if over limit.
 */
@Component
public class RateLimitGlobalFilter implements GlobalFilter, Ordered {

    private final RateLimitService rateLimitService;
    private final TeamConfigService teamConfigService;

    public RateLimitGlobalFilter(RateLimitService rateLimitService, TeamConfigService teamConfigService) {
        this.rateLimitService = rateLimitService;
        this.teamConfigService = teamConfigService;
    }

    @Override
    public int getOrder() {
        return -1;  // runs after JwtGlobalFilter (-2)
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getPath().value();

        // Skip rate limiting for auth and actuator endpoints
        if (path.startsWith("/auth/register") || path.startsWith("/auth/login")
                || path.startsWith("/auth/refresh") || path.startsWith("/actuator")) {
            return chain.filter(exchange);
        }

        String userId = exchange.getAttribute("userId");
        String teamId = exchange.getAttributeOrDefault("teamId", "default");

        if (userId == null) {
            // JWT filter already rejected unauthenticated requests — this shouldn't happen
            return chain.filter(exchange);
        }

        // Fetch the team's rate limit from Postgres (blocking call on bounded elastic thread)
        return Mono.fromCallable(() -> teamConfigService.getRequestsPerHour(teamId))
                .subscribeOn(Schedulers.boundedElastic())
                .flatMap(limit -> rateLimitService.isAllowed(userId, limit))
                .flatMap(allowed -> {
                    if (allowed) {
                        return chain.filter(exchange);
                    }
                    // Rate limited — respond with 429 and Retry-After header
                    exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
                    exchange.getResponse().getHeaders().set("Retry-After", "3600");
                    exchange.getResponse().getHeaders().set("X-RateLimit-Limit",
                            String.valueOf(teamConfigService.getRequestsPerHour(teamId)));
                    return exchange.getResponse().setComplete();
                });
    }
}
