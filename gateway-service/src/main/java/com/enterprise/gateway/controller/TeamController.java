// This file belongs to the controller package (web endpoints)
package com.enterprise.gateway.controller;

// The data an admin sends to change limits
import com.enterprise.gateway.dto.TeamLimitsRequest;
// The database table class for team settings
import com.enterprise.gateway.entity.TeamConfig;
// The service that does the real work
import com.enterprise.gateway.service.TeamConfigService;
// Lets us build a full HTTP response
import org.springframework.http.ResponseEntity;
// Import the web annotations like @PutMapping
import org.springframework.web.bind.annotation.*;
// Mono means "one result that arrives later" (used in reactive code)
import reactor.core.publisher.Mono;
// Lets us pick which thread runs some work
import reactor.core.scheduler.Schedulers;

// Says this class answers web requests and returns JSON
@RestController
// All endpoints in this class start with /gateway/teams
@RequestMapping("/gateway/teams")
// This class lets admins change the rate limits for a team
public class TeamController {

    // The service that reads and saves team settings
    private final TeamConfigService teamConfigService;

    // Spring gives us the service when it creates this class
    public TeamController(TeamConfigService teamConfigService) {
        // Save the service so the method below can use it
        this.teamConfigService = teamConfigService;
    }

    /**
     * PUT /gateway/teams/{teamId}/limits
     * Admins can adjust per-team rate limits without restarting the gateway.
     * Changes take effect immediately on the next request.
     */
    // Runs when someone sends PUT /gateway/teams/{teamId}/limits
    @PutMapping("/{teamId}/limits")
    public Mono<ResponseEntity<TeamConfig>> updateLimits(
            // Take the team id from the URL
            @PathVariable String teamId,
            // Read the JSON body as a TeamLimitsRequest
            @RequestBody TeamLimitsRequest request
    ) {
        // Run the update later, when a thread is ready
        return Mono.fromCallable(() -> teamConfigService.updateLimits(teamId, request))
                // The database call blocks, so run it on a thread meant for blocking work
                // (this keeps the fast gateway threads free)
                .subscribeOn(Schedulers.boundedElastic())
                // Wrap the saved settings in a 200 (OK) response
                .map(ResponseEntity::ok);
    }
}
