package com.enterprise.gateway.controller;

import com.enterprise.gateway.dto.TeamLimitsRequest;
import com.enterprise.gateway.entity.TeamConfig;
import com.enterprise.gateway.service.TeamConfigService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

@RestController
@RequestMapping("/gateway/teams")
public class TeamController {

    private final TeamConfigService teamConfigService;

    public TeamController(TeamConfigService teamConfigService) {
        this.teamConfigService = teamConfigService;
    }

    /**
     * PUT /gateway/teams/{teamId}/limits
     * Admins can adjust per-team rate limits without restarting the gateway.
     * Changes take effect immediately on the next request.
     */
    @PutMapping("/{teamId}/limits")
    public Mono<ResponseEntity<TeamConfig>> updateLimits(
            @PathVariable String teamId,
            @RequestBody TeamLimitsRequest request
    ) {
        return Mono.fromCallable(() -> teamConfigService.updateLimits(teamId, request))
                .subscribeOn(Schedulers.boundedElastic())
                .map(ResponseEntity::ok);
    }
}
